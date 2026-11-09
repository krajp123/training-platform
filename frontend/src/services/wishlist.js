const WISHLIST_STORAGE_KEY = 'scs_wishlist';
const WISHLIST_UPDATED_EVENT = 'scs-wishlist-updated';

export function getWishlist() {
  const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
  if (!savedWishlist) return [];

  const wishlist = JSON.parse(savedWishlist);
  if (!Array.isArray(wishlist)) {
    throw new Error('Your saved wishlist data is invalid.');
  }
  return wishlist;
}

function saveWishlist(wishlist) {
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
  window.dispatchEvent(new CustomEvent(WISHLIST_UPDATED_EVENT, { detail: wishlist }));
}

export function toggleWishlist(course) {
  const id = String(course.cartId ?? course.id ?? '');
  if (!id || !course.title) {
    throw new Error('Course details are incomplete, so it could not be added to your wishlist.');
  }

  const price = Number(String(course.price).replace(/[^\d.]/g, ''));
  if (!Number.isFinite(price) || price < 0) {
    throw new Error('This course has an invalid price and cannot be added to your wishlist.');
  }

  const wishlist = getWishlist();
  const isWishlisted = wishlist.some((item) => item.id === id);
  const updatedWishlist = isWishlisted
    ? wishlist.filter((item) => item.id !== id)
    : [...wishlist, {
      ...course,
      id,
      price,
      image: course.image || '',
    }];
  saveWishlist(updatedWishlist);
  return updatedWishlist;
}

export function removeFromWishlist(courseId) {
  const updatedWishlist = getWishlist().filter((item) => item.id !== String(courseId));
  saveWishlist(updatedWishlist);
  return updatedWishlist;
}

export function subscribeToWishlist(onChange) {
  const handleUpdate = (event) => onChange(event.detail || getWishlist());
  const handleStorage = (event) => {
    if (event.key === WISHLIST_STORAGE_KEY) onChange(getWishlist());
  };

  window.addEventListener(WISHLIST_UPDATED_EVENT, handleUpdate);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(WISHLIST_UPDATED_EVENT, handleUpdate);
    window.removeEventListener('storage', handleStorage);
  };
}
