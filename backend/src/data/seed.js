export const courses = [
  {
    id: 1, title: 'UI/UX Design Fundamentals', category: 'Design', level: 'Beginner',
    instructor: 'Sarah Chen', initials: 'SC', rating: '4.9', students: '2.4k',
    lessons: 24, duration: '8 weeks', price: 2499, oldPrice: 3999,
    image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=900&q=85',
    color: 'lavender', progress: 68, enrolled: true,
  },
  {
    id: 2, title: 'Full Stack Web Development', category: 'Development', level: 'Intermediate',
    instructor: 'Marcus Johnson', initials: 'MJ', rating: '4.8', students: '1.8k',
    lessons: 42, duration: '12 weeks', price: 3999, oldPrice: 5999,
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=85',
    color: 'mint', progress: 34, enrolled: true,
  },
  {
    id: 3, title: 'Data Science with Python', category: 'Data Science', level: 'Beginner',
    instructor: 'Priya Sharma', initials: 'PS', rating: '4.9', students: '3.1k',
    lessons: 36, duration: '10 weeks', price: 3499, oldPrice: 4999,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=85',
    color: 'peach', progress: 0, enrolled: false,
  },
  {
    id: 4, title: 'Product Management Essentials', category: 'Business', level: 'Beginner',
    instructor: 'Alex Rivera', initials: 'AR', rating: '4.7', students: '980',
    lessons: 18, duration: '6 weeks', price: 1999, oldPrice: 2999,
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=85',
    color: 'blue', progress: 0, enrolled: false,
  },
  {
    id: 5, title: 'Digital Marketing Masterclass', category: 'Marketing', level: 'Intermediate',
    instructor: 'Nina Patel', initials: 'NP', rating: '4.8', students: '1.2k',
    lessons: 28, duration: '9 weeks', price: 2799, oldPrice: 4299,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=85',
    color: 'yellow', progress: 0, enrolled: false,
  },
  {
    id: 6, title: 'Python Programming Bootcamp', category: 'Development', level: 'Beginner',
    instructor: 'David Kim', initials: 'DK', rating: '4.9', students: '2.7k',
    lessons: 32, duration: '8 weeks', price: 2299, oldPrice: 3499,
    image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=85',
    color: 'mint', progress: 0, enrolled: false,
  },
];

export const liveClasses = [
  {
    id: 1, time: '10:30 AM', date: 'Today', title: 'Design systems: from zero to one',
    course: 'UI/UX Design Fundamentals', instructor: 'Sarah Chen', initials: 'SC',
    status: 'Live now', color: 'live',
  },
  {
    id: 2, time: '02:00 PM', date: 'Today', title: 'Building your first REST API',
    course: 'Full Stack Web Development', instructor: 'Marcus Johnson', initials: 'MJ',
    status: 'In 3 hours', color: 'upcoming',
  },
  {
    id: 3, time: '11:00 AM', date: 'Tomorrow', title: 'Python for data analysis',
    course: 'Data Science with Python', instructor: 'Priya Sharma', initials: 'PS',
    status: 'Tomorrow', color: 'later',
  },
];
