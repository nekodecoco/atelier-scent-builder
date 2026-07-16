import { useEffect, useRef } from 'react';
import { fetchServerCart, saveServerCart } from '../lib/cart';
import { useAuthStore } from '../store/useAuthStore';
import { mergeCartItems, useCartStore } from '../store/useCartStore';

const SAVE_DEBOUNCE_MS = 600;

/**
 * Keeps a signed-in customer's cart in sync with their server-side `carts` row
 * so it follows them across devices. Guests keep using the localStorage cart.
 *
 * - Sign-in: pull the server cart, merge it with the local (guest) cart, and
 *   push the union back.
 * - While signed in: mirror cart edits to the server (debounced).
 * - Sign-out: drop the local cart so the next person on a shared browser can't
 *   inherit it.
 *
 * When Supabase isn't configured the data layer no-ops, so this stays inert.
 */
export function useCartSync() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const items = useCartStore((s) => s.items);

  // id of the user whose server cart is loaded and now being mirrored — saves
  // stay blocked until the initial merge lands, so we never overwrite the
  // server with a pre-merge cart.
  const syncedUserId = useRef<string | null>(null);
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    const previous = prevUserId.current;
    prevUserId.current = userId;

    if (userId && userId !== previous) {
      let cancelled = false;
      syncedUserId.current = null;
      void (async () => {
        const result = await fetchServerCart();
        if (cancelled) return;

        // Couldn't read the server cart: leave the local one exactly as it is
        // and stay out of mirroring, so a transient failure can never overwrite
        // a real server cart with an empty one.
        if (!result.ok) return;

        const { items: local, ownerId, setItems, setOwner } = useCartStore.getState();

        // Merging is a ONE-TIME hand-off: only a guest cart (ownerId === null)
        // gets folded into the account. Once the cart belongs to a user it is
        // just a mirror of the server copy — merging again would sum the same
        // quantities into themselves and double the cart on every load.
        const next = ownerId === null ? mergeCartItems(result.items, local) : result.items;

        setItems(next);
        setOwner(userId);
        syncedUserId.current = userId;
        await saveServerCart(next);
      })();
      return () => {
        cancelled = true;
      };
    }

    if (!userId && previous) {
      syncedUserId.current = null;
      const { clear, setOwner } = useCartStore.getState();
      clear();
      setOwner(null); // back to a guest cart, mergeable on the next sign-in
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || syncedUserId.current !== userId) return;
    const timer = setTimeout(() => void saveServerCart(items), SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [items, userId]);
}
