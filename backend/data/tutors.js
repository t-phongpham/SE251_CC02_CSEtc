const tutors = [
  {
    id: 'a',
    name: 'Nguyễn Văn A',
    title: 'Calculus 1',
    degree: 'MSc',
    position: 'Lecturer',
    specialization: 'Calculus & Analysis',
    yearsOfExperience: 3,
    services: ['Exam preparation', 'Exercise review'],
    education: '2019: Bachelor of Mathematics – HCMUT',
    rating: 4.5,
    ratingCount: 25,
    photoUrl: 'https://placehold.co/229x247',
    intro:
      'Mr. Nguyen Van A supports students in Calculus 1 and calculus-related courses, focusing on problem-solving and concept clarification.',
  },

  {
    id: 'b',
    name: 'Nguyễn Văn B',
    title: 'Data Structures & Algorithms',
    degree: 'PhD',
    position: 'Lead academic tutor',
    specialization: 'Data Structures & Algorithms',
    yearsOfExperience: 4,
    services: ['One-on-one tutoring', 'Exam preparation guidance'],
    education:
      '2021: Bachelor of Computer Science – University of Technology\n2023: Currently pursuing Master’s degree in Computer Science',
    rating: 4.8,
    ratingCount: 12,
    photoUrl: 'https://placehold.co/229x247',
    intro:
      'Mr. Nguyen Van B has strong experience in academic tutoring and student guidance. He helps learners master coursework and improve study methods.',
    reviews: [
      {
        studentName: 'Student A',
        rating: 5.0,
        body:
          '"One of the best tutors I’ve had. They explain algorithms visually and step-by-step, making tough ideas easy to understand."',
      },
      {
        studentName: 'Anonymous user',
        rating: 4.8,
        body:
          '"I really benefited from the explanations on linked lists and binary trees. The tutor uses simple analogies to explain complex structures."',
      },
    ],
  },
  
];

module.exports = tutors;
