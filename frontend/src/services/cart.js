const CART_STORAGE_KEY = 'scs_cart';
const SAVED_STORAGE_KEY = 'scs_saved_courses';
const CART_UPDATED_EVENT = 'scs-cart-updated';

export function getCart() {
  const savedCart = localStorage.getItem(CART_STORAGE_KEY);
  if (!savedCart) return [];

  const cart = JSON.parse(savedCart);
  if (!Array.isArray(cart)) {
    throw new Error('Your saved cart data is invalid. Please clear the cart and try again.');
  }
  return cart;
}

export function getSavedCourses() {
  const savedCourses = localStorage.getItem(SAVED_STORAGE_KEY);
  if (!savedCourses) return [];

  const courses = JSON.parse(savedCourses);
  if (!Array.isArray(courses)) {
    throw new Error('Your saved courses data is invalid.');
  }
  return courses;
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: cart }));
}

function saveSavedCourses(courses) {
  localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(courses));
}

function normalizePrice(price) {
  const amount = Number(String(price).replace(/[^\d.]/g, ''));
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('This course has an invalid price and cannot be added to your cart.');
  }
  return amount;
}

export function addToCart(course) {
  const id = String(course.cartId ?? course.id ?? '');
  if (!id || !course.title) {
    throw new Error('Course details are incomplete, so it could not be added to your cart.');
  }

  const cart = getCart();
  if (cart.some((item) => item.id === id)) return cart;

  const item = {
    id,
    title: course.title,
    price: normalizePrice(course.price),
    image: course.image || '',
    duration: course.duration || '',
    category: course.category || course.type || 'Professional training',
    description: course.description || '',
    instructor: course.instructor || course.author || 'SCS Academy',
    rating: course.rating || '4.8',
    ratingsCount: course.ratingsCount || '',
    level: course.level || 'All Levels',
    hours: course.hours || '',
    badge: course.badge || '',
    premium: course.premium ?? false,
  };
  const updatedCart = [...cart, item];
  saveCart(updatedCart);
  return updatedCart;
}

export function removeFromCart(courseId) {
  const updatedCart = getCart().filter((item) => item.id !== String(courseId));
  saveCart(updatedCart);
  return updatedCart;
}

export function saveForLater(courseId) {
  const cart = getCart();
  const course = cart.find((item) => item.id === String(courseId));
  if (!course) return { cart, saved: getSavedCourses() };

  const saved = getSavedCourses();
  const updatedSaved = saved.some((item) => item.id === course.id) ? saved : [...saved, course];
  const updatedCart = cart.filter((item) => item.id !== course.id);
  saveSavedCourses(updatedSaved);
  saveCart(updatedCart);
  return { cart: updatedCart, saved: updatedSaved };
}

export function moveSavedToCart(courseId) {
  const saved = getSavedCourses();
  const course = saved.find((item) => item.id === String(courseId));
  if (!course) return { cart: getCart(), saved };

  const updatedCart = getCart();
  if (!updatedCart.some((item) => item.id === course.id)) updatedCart.push(course);
  const updatedSaved = saved.filter((item) => item.id !== course.id);
  saveSavedCourses(updatedSaved);
  saveCart(updatedCart);
  return { cart: updatedCart, saved: updatedSaved };
}

export function removeSavedCourse(courseId) {
  const updatedSaved = getSavedCourses().filter((item) => item.id !== String(courseId));
  saveSavedCourses(updatedSaved);
  return updatedSaved;
}

export function clearCartData() {
  localStorage.removeItem(CART_STORAGE_KEY);
  localStorage.removeItem(SAVED_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: [] }));
  return [];
}

export function subscribeToCart(onChange) {
  const handleUpdate = (event) => onChange(event.detail || getCart());
  const handleStorage = (event) => {
    if (event.key === CART_STORAGE_KEY) onChange(getCart());
  };

  window.addEventListener(CART_UPDATED_EVENT, handleUpdate);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(CART_UPDATED_EVENT, handleUpdate);
    window.removeEventListener('storage', handleStorage);
  };
}
