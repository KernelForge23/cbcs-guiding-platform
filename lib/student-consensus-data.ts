export interface StudentConsensusEntry {
  courseCode: string;
  courseName: string;
  aliases: string[];
  consensusText: string;
}

export const PLACEHOLDER_CONSENSUS_TEXT =
  "Digital Public Infrastructure is an **incredibly interesting** and **highly scoring** course that offers excellent **new field exploration** into India's digital frameworks. You will explore real-world software domains and industry-level projects. It is very **concept-heavy** rather than **math-heavy**, making it a great fit if you enjoy **application-based learning** instead of solving numerical equations. The overall **difficulty is low**, and the PPTs provided in class are entirely sufficient to help you get good marks. However, because it is so scoring, the **grading curve is highly competitive**; you should expect a **moderate workload** where putting genuine effort into your submissions is key. The course also has a **strong practical focus**, featuring hands-on activities and engaging class discussions that bring the theory to life. Overall, it is a highly rewarding, **GPA-friendly** course that gives you a valuable understanding of how national digital ecosystems work.";

export const STUDENT_CONSENSUS_DATA: Record<string, StudentConsensusEntry> = {
  // 1. MAC+VCDE
  "26U1BSML002/26U1BSML004": {
    courseCode: "26U1BSML002/26U1BSML004",
    courseName: "Matrix Algebra and Calculus + Vector Calculus and Differential Equations",
    aliases: ["MAC+VCDE", "MAC", "VCDE", "26U1BSML002/004"],
    consensusText:
      "MAC+VCDE is a **highly mathematical course** that builds heavily on your **11th and 12th-grade calculus and matrix foundations**, making a **strong prior background essential** for a smooth learning experience. The Matrix Algebra and Calculus (MAC) portion is **very practice-based** and generally considered **easier**, while Vector Calculus and Differential Equations (VCDE) will **push your academic limits** with **tougher theoretical concepts** and theorems that must be learned deeply. Because solving these complex problems requires mastering specific step-by-step methods, you should expect to dedicate a **solid amount of time outside of class** to solve tutorial sheets and watch helpful YouTube lectures. While the subject is **not heavily hands-on** in a physical sense, the VCDE portion does introduce some **challenging practical lab implementations**. Overall, it is a **rigorous and highly rewarding** course that equips you with **powerful mathematical problem-solving skills** for your future studies.",
  },

  // 2. LA+PS
  "26U1BSML001/26U1BSML003": {
    courseCode: "26U1BSML001/26U1BSML003",
    courseName: "Linear Algebra + Probability and Statistics",
    aliases: ["LA+PS", "LA", "PS", "26U1BSML001/003"],
    consensusText:
      "LA+PS is an **engaging course** that bridges your **11th and 12th-grade foundations** with exciting **new fields of study**, particularly in the Linear Algebra (LA) section. It is **heavily focused on math and logical problem-solving** rather than memorizing heavy theory, meaning success comes from deeply understanding the \"why\" behind the formulas. The course will certainly **push your academic limits** with fresh, **logic-based exam questions**, so you should be prepared to dedicate **steady time outside of class** to practice. The Probability and Statistics (PS) half is generally considered **more manageable to learn**. While it is a challenging subject, utilizing outside resources like YouTube or AI tools makes mastering the material **highly rewarding**, and the mathematical logic you learn offers **excellent practical applications**.",
  },

  // 3. EP+EC
  "26U1BSPB001/26U1BSCB001": {
    courseCode: "26U1BSPB001/26U1BSCB001",
    courseName: "Engineering Physics + Engineering Chemistry",
    aliases: ["EP+EC", "EP", "EC", "BSPB001 / BSCB001"],
    consensusText:
      "EP+EC is an **engaging sequence** where the two subjects offer very different learning experiences. Engineering Physics (EP) **builds directly on your 11th and 12th-grade foundations**, focusing heavily on **mathematical derivations and logical problem-solving**. In contrast, Engineering Chemistry (EC) introduces **exciting new theoretical concepts** that will push you to explore beyond your high school basics. While both subjects are generally considered **easy to score in**, this makes the **relative grading highly competitive**, meaning the exams will **push your academic limits** in terms of perfect accuracy. You should expect a **straightforward workload for EP** by following the class slides, but EC will require you to dedicate **steady time outside of class** to deeply understand and memorize the **heavy theory**. On the practical side, the **EP labs are quite relaxed**, while the **EC labs are stricter** and demand **careful, hands-on attention**. Overall, balancing your mathematical practice in EP with deep conceptual understanding in EC makes for a **highly rewarding experience**.",
  },

  // 4. EP+QP
  "26U1BSPB001/26U1BSPL001": {
    courseCode: "26U1BSPB001/26U1BSPL001",
    courseName: "Engineering Physics + Quantum Physics",
    aliases: ["EP+QP", "QP", "BSPB001 / BSPL001"],
    consensusText:
      "EP+QP is a **fascinating sequence** that blends familiar topics with **completely new areas of study**. The Engineering Physics (EP) portion **builds directly on your 11th and 12th-grade foundations**, while Quantum Physics (QP) invites you to explore a **completely new and complex scientific field**. This course is **exceptionally theory-focused** and requires you to deeply understand complex concepts rather than just memorizing facts. Because it relies heavily on **mathematical proofs and logical derivations**, mastering the underlying math will make solving the exam problems much easier. You should be prepared for this subject to **truly push your academic limits**, especially in QP, making it a **poor choice if you are simply looking for a quick GPA boost** with minimal effort. To succeed, you must dedicate a **heavy amount of time outside of class** to complete weekly tutorials and build strong fundamentals. While it **does not focus heavily on hands-on practical applications**, the deep analytical skills and theoretical clarity you gain make it a **highly rewarding challenge**.",
  },

  // 5. Electromagnetism
  "26U1BSPL002": {
    courseCode: "26U1BSPL002",
    courseName: "Electromagnetism",
    aliases: ["EM", "Electromagnetism"],
    consensusText:
      "Electromagnetism is a **strictly theoretical course** that offers fascinating **new field exploration** into how various physical fields and electromagnetic waves work. It is a **highly math-heavy and concept-heavy** subject that heavily relies on your **foundation in basic vector calculus**, covering analytical topics like gradient, divergence, curl, and Maxwell's equations. There is **absolutely zero practical focus** or lab work involved, making it a very satisfying choice if you prefer **purely analytical theory**. The overall **difficulty is manageable**, and the class notes provided are **more than enough** to help you secure a top score. However, because you must memorize complex formulas and consistently practice numerical problems, you should expect a **dedicated workload** that requires **consistent time and effort outside of class**. Overall, it is a **rewarding, purely math-based physics course** that is **highly scoring** as long as you are willing to put in the necessary practice.",
  },

  // 6. Semiconductor Physics
  "26U1BSPL003": {
    courseCode: "26U1BSPL003",
    courseName: "Semiconductor Physics",
    aliases: ["Semi", "Semiconductor Physics"],
    consensusText:
      "Semiconductor Physics **directly builds on your 12th-grade 'Solid State' foundations**. The subject perfectly balances **descriptive theory with spatial problem-solving**, avoiding grueling, heavy mathematical calculations. Because it introduces abstract quantum concepts without demanding extreme derivations, it will **push your academic limits just enough** to be fascinating. You **won't need to dedicate a heavy amount of time** outside of class, as the 1-credit scope keeps the **workload very manageable**. While the purely theoretical curriculum **completely lacks hands-on practical applications**, it makes up for it with mind-bending physics. Overall, it is a **highly rewarding course** for anyone who enjoys **visualizing atomic structures**.",
  },

  // 7. Biology for Engineers
  "26U1BSBL001": {
    courseCode: "26U1BSBL001",
    courseName: "Biology for Engineers",
    aliases: ["BFE", "Bio", "Biology for Engineers"],
    consensusText:
      "Biology for Engineers is a **uniquely relaxing course** that allows you to explore an **interesting new field**, gently building on just a few basic 11th and 12th-grade foundations. The subject is **entirely theoretical**, making it an excellent choice if you enjoy deeply understanding and **memorizing biological concepts**. If you prefer heavy mathematical calculations and logical problem-solving, you might want to look elsewhere, as this course contains **absolutely zero math or numericals**. It is **very simple to grasp** and will not aggressively push your academic limits, though you should be aware that because the papers are easy, the **relative grading can become quite competitive**. You will **not need to dedicate a heavy amount of time** outside of class, as the overall **workload is extremely light** and requires very little extra effort to secure a good CGPA. Finally, the course focuses **purely on theory with no hands-on practical applications**, making it a wonderful, **low-stress option** for anyone curious about biology.",
  },

  // 8. ETES
  "26U1BSCL001": {
    courseCode: "26U1BSCL001",
    courseName: "Emerging Technologies in Energy Storage",
    aliases: ["ETES", "Emerging Technologies in Energy Storage", "Energy Storage"],
    consensusText:
      "ETES is an **interesting, industry-focused course** that smoothly **builds on your 11th and 12th-grade electrochemistry foundations**, giving you a noticeable advantage if you have already taken Engineering Chemistry (EC). The subject focuses **heavily on theoretical concepts** and requires you to comfortably **memorize factual information** rather than deeply analyzing complex mechanisms. If you prefer heavy mathematical calculations or logical problem-solving, you will find very little of that here. Because the content is **simple to grasp**, the course will not severely push your academic limits, but you should be prepared for **highly competitive relative grading** since most students score very well on the predictable exams. You will certainly **not need to dedicate a heavy amount of time outside of class**, as the overall **workload is extremely light and stress-free**. While the course teaches you about fascinating real-world industrial applications like battery cells, it **does not currently offer any physical, hands-on practical experience** in a lab setting. Ultimately, it is a wonderful, **low-effort option for improving your overall CGPA**.",
  },

  // 9. Nanomaterials in Emerging Technologies
  "26U1BSCL002": {
    courseCode: "26U1BSCL002",
    courseName: "Nanomaterials in Emerging Technologies",
    aliases: ["NET", "Nanomaterials in Emerging Tech", "Nanomaterials in Emerging Technologies"],
    consensusText:
      "Nanomaterials in Emerging Technologies is an **exceptionally easy and GPA-friendly course**, though it offers limited new field exploration as its foundations act as a direct continuation of **11th and 12th-grade basic chemistry**. It is a **purely concept-heavy and memorization-based subject** that covers synthesis techniques and theoretical applications in various fields, involving **absolutely no math-heavy calculations**. Additionally, there is **zero practical focus or hands-on application** involved, making it a strictly theoretical course. The **overall difficulty is extremely low**; the professor provides **excellent notes that are entirely sufficient**, meaning the outside **workload is virtually non-existent**. In fact, many students report securing top grades by studying just **one day before the exam**. However, there is one catch: **attendance is strictly monitored** and carries marks, so you cannot just skip the lectures. Overall, if you want a **low-stress, highly scoring course to easily boost your pointer** and do not mind rote memorization, this is a **perfect choice**.",
  },

  // 10. Basics of Civil Engineering
  "26U1ESEL001": {
    courseCode: "26U1ESEL001",
    courseName: "Basics of Civil Engineering",
    aliases: ["BCE", "Civil Basics", "Basics of Civil Engineering"],
    consensusText:
      "Basics of Civil Engineering is an **excellent introductory course** that gives you foundational knowledge in construction, exploring **entirely new concepts** unrelated to your 11th or 12th-grade studies. The subject is **highly theoretical and concept-heavy**, meaning your success relies heavily on your ability to **memorize detailed information and draw numerous diagrams** rather than developing problem-solving logic. Because it contains **almost no math or heavy calculations**, the difficulty ranges from easy to moderately tough purely based on your memorization skills. You **will not need to dedicate a heavy amount of time outside of class**; making notes directly from the **professor's PPTs** and studying them just a few days before the exam is **entirely sufficient to get good grades** without any external resources. While there are **absolutely no hands-on practical elements**, the application-based theory makes it a **very low-effort and rewarding course** for students who are good at memorizing.",
  },

  // 11. FPI
  "26U1ESEL009": {
    courseCode: "26U1ESEL009",
    courseName: "Fundamentals of Physical Infrastructure",
    aliases: ["FPI", "Fundamentals of Physical Infrastructure"],
    consensusText:
      "FPI is a **purely theoretical course** that relies entirely on **rote memorization** rather than logical or concept-driven problem-solving. Because the exams strictly demand **highly descriptive, to-the-point answers**, the course will **severely push your academic limits** if you struggle with memorizing vast amounts of text. You **won't need to dedicate a heavy amount of time outside of class** searching for resources, as the **professor's PPTs and class examples are completely sufficient**. While it **lacks any hands-on practical applications**, it acts as an **easy GPA booster** for students who naturally excel at memorization. However, if you are a logical student who tries to apply outside reasoning instead of just mugging up the slides, you will likely find the **strict grading frustrating** and struggle to score well.",
  },

  // 12. AIMA
  "26U1ESEL002": {
    courseCode: "26U1ESEL002",
    courseName: "AI for Multidisciplinary Applications",
    aliases: ["AIMA", "AI for Multidisciplinary Applications"],
    consensusText:
      "If you are curious about the exciting world of Artificial Intelligence but **want to avoid intense coding**, AIMA is a fantastic choice that lets you explore a **completely new field** without relying on any high school foundations. The course focuses **purely on theoretical concepts**, teaching you fascinating basics like the history of AI, its various types, and how to **effectively prompt AI tools**. Because there are **no mathematical calculations or logical problem-solving tasks**, your success will depend entirely on your ability to **deeply memorize content** and write well-elaborated, descriptive answers in exams. The **difficulty is very manageable** and will not aggressively push your academic limits, provided you do continuous, light revision. You **will not need to dedicate a heavy amount of time outside of class**, as the overall **workload is low** and assignments give you plenty of time to finish. While the course **lacks hands-on, practical coding applications**, it is a **highly rewarding and low-stress option** for students who excel at memorization and want to learn about AI while **easily maintaining a strong CGPA**.",
  },

  // 13. EEU
  "26U1ESEL003": {
    courseCode: "26U1ESEL003",
    courseName: "Electrical Energy Utilization",
    aliases: ["EEU", "Electrical Energy Utilization"],
    consensusText:
      "EEU is a **demanding course** that starts with familiar 11th and 12th-grade electrical basics, like AC current, but quickly builds into vastly **more complex and detailed theory**. The exams feature a **rigorous split between deep conceptual theory and heavy mathematical calculations**, meaning you cannot rely on rote memorization alone. Because the subject matter gets progressively tougher, it will **absolutely push your academic limits** and requires serious hard work to understand the vast syllabus. However, your everyday workload can be managed by focusing strictly on the **professor's notes** and using tools like ChatGPT to clarify concepts. There are **no hands-on practical elements** in this course. Ultimately, while it is considered a **very tough subject**, the high difficulty means the **relative grading curve is extremely forgiving**, allowing dedicated students to still **secure a great CGPA** if they are willing to put in a strong final push.",
  },

  // 14. AEIOT
  "26U1ESEL004": {
    courseCode: "26U1ESEL004",
    courseName: "Applied Electronics and IOT",
    aliases: ["AEIOT", "Applied Electronics and IOT", "IoT"],
    consensusText:
      "If you are genuinely fascinated by hardware and electronics, AEIOT offers a **highly rewarding opportunity to get hands-on with real practical applications**. The course begins by **building directly on your 11th and 12th-grade electrical foundations** before branching out to explore **exciting, completely new concepts in the world of IoT**. You should know that the subject focuses heavily on **deep theoretical concepts and requires significant memorization**, meaning it is not a great fit if you prefer heavy mathematical calculations or logical problem-solving. Because some of the later topics can be quite complex, the course will **certainly push your academic limits**. To succeed, you must be willing to dedicate a **heavy amount of time outside of class** for independent self-study, presentations, and **demanding lab work**. While the **high workload and tough theory** make it a challenging subject, it is a **fantastic and engaging choice** for students who love practical hardware and are willing to put in the effort.",
  },

  // 15. FMS
  "26U1ESEL005": {
    courseCode: "26U1ESEL005",
    courseName: "Fundamentals of Measurement and Sensors",
    aliases: ["FMS", "Fundamentals of Measurement and Sensors", "Sensors"],
    consensusText:
      "If you have a strong curiosity about how sensors work and are eager to **explore a completely new field** far removed from your 11th and 12th-grade syllabus, FMS is a **fascinating but demanding choice**. The course features a vast syllabus that focuses heavily on **deep theoretical concepts and memorization**, meaning you will face **very few mathematical calculations or numericals**. Because the curriculum is so broad and the exams are challenging, this subject will **definitely push your academic limits** and requires serious dedication to maintain a strong CGPA. You must be willing to dedicate a **heavy amount of time outside of class**, as there is a strong emphasis on **self-learning and a major project** at the end of the semester that demands intense focus. While physical hands-on experiences are mostly limited to virtual labs, the final project gives you a great opportunity to **practically apply the theory** you have learned. Overall, it is a **highly rewarding course** for those truly interested in measurement instruments, provided you are ready to tackle a **heavy theoretical workload**.",
  },

  // 16. FME
  "26U1ESEL006": {
    courseCode: "26U1ESEL006",
    courseName: "Foundation in Mechanical Engineering",
    aliases: ["FME", "Foundation in Mechanical Engineering"],
    consensusText:
      "FME is a **highly rewarding but time-consuming course** that serves as a fantastic introduction to mechanical engineering. While it **builds partially on 11th and 12th-grade mechanics**, it introduces a **massive amount of new theory**. Because the syllabus is so vast and **memorization-heavy**, it will **challenge your academic limits** if you dislike studying theory. You should expect a **significant workload outside of class** to regularly revise the material and **practice diagrams**, though you won't need external resources since the **exhaustive PPTs provided by the professor are more than enough**. The exams heavily favor **detailed, elaborative answers and drawing numerous diagrams** rather than complex mathematical numericals. Despite the heavy workload, the **real-world practical applications** of understanding how machines work make it an **incredibly scoring and engaging subject** for dedicated students.",
  },

  // 17. BMT
  "26U1ESEL007": {
    courseCode: "26U1ESEL007",
    courseName: "Basics of Manufacturing Technology",
    aliases: ["BMT", "Basics of Manufacturing Technology"],
    consensusText:
      "If you have a strong imagination and enjoy drawing, BMT is a **unique course that lets you explore a completely new field** far removed from your previous high school knowledge. The subject is **entirely focused on deep theoretical concepts**, requiring you to **clearly visualize manufacturing processes** and **draw numerous detailed diagrams**. Because it relies heavily on memorization and spatial imagination, there are **practically no mathematical calculations or logical numericals involved**. The **difficulty is generally moderate**, but the subject will certainly **push your academic limits** if you struggle with memorizing vast amounts of theory. You should expect to dedicate a **fair amount of time outside of class** to complete several assignments and practice drawing your diagrams. While the course focuses more on **theoretical visualization rather than physical, hands-on practical applications**, it offers a **highly rewarding mental challenge** for students who excel at visual learning and want to understand how things are made.",
  },

  // 18. Nanomaterials
  "26U1ESEL008": {
    courseCode: "26U1ESEL008",
    courseName: "Nanomaterials",
    aliases: ["Nanomaterials", "Nano Metallurgy"],
    consensusText:
      "Nanomaterials is an **incredibly relaxing and GPA-friendly course** that lets you explore a **fascinating new field** while gently building on just a few basic 11th and 12th-grade chemistry foundations. The subject is **overwhelmingly focused on theoretical concepts**, making it an excellent choice if you enjoy **memorization rather than heavy mathematical calculations** or logical problem-solving. Because the content is **very simple to grasp**, it will **absolutely not push your academic limits**, provided you attend the **strictly-graded lectures** and review the professor's notes. You will certainly **not need to dedicate a heavy amount of time outside of class**, as the overall **workload is extremely light** and many students easily succeed by studying just **one night before the exam**. While the course **lacks any hands-on practical applications or lab exposure**, it is a **highly rewarding option** for students across all branches looking for an **easy GPA booster with minimal stress**.",
  },

  // 19. Applied Mechanics
  "26U1ESEB001": {
    courseCode: "26U1ESEB001",
    courseName: "Applied Mechanics",
    aliases: ["AM", "Applied Mechanics"],
    consensusText:
      "Applied Mechanics is an **interesting course** that **builds right on 11th and 12th-grade physics**. You will explore real-world topics like **forces, balancing, and Trusses**. It involves a **lot of math and calculations**, making it a great fit if you enjoy **solving numerical problems rather than memorizing theory**. The notes and questions provided in class are **enough to help you get good marks**. Because the exams can be long, **practicing at home and managing your time well** is key to doing your best. The course also includes **helpful, hands-on lab sessions** that bring the concepts to life. Overall, it is a **very practical course** that gives you a **solid understanding of how physical structures work**.",
  },

  // 20. FCS
  "26U1ESEB002": {
    courseCode: "26U1ESEB002",
    courseName: "Fundamentals of Cyber Security",
    aliases: ["FCS", "Cyber Security", "Fundamentals of Cyber Security"],
    consensusText:
      "FCS is a **gentle and highly interesting course** that offers **great new field exploration** into cybersecurity with **virtually no prior knowledge required**. The subject is **mostly theoretical**, meaning you will not face any heavy mathematical calculations. Because the content is **so easy to grasp**, you **won't need to dedicate a heavy amount of time outside of class**; simply reviewing class notes and framing well-thought-out answers is completely sufficient. However, because the exams are so straightforward, the **relative grading becomes fiercely competitive**, meaning even tiny mistakes can **severely drop your CGPA** and punish average scorers. Alongside the light theoretical workload, the course features **highly engaging, hands-on lab sessions** that bring the concepts to life. Overall, it is a **highly rewarding subject** if you have a genuine interest in cybersecurity and the focus to **maintain perfect accuracy in your exams**.",
  },

  // 21. BEE
  "26U1ESEB003": {
    courseCode: "26U1ESEB003",
    courseName: "Basic Electrical Engineering",
    aliases: ["BEE", "Basic Electrical Engineering"],
    consensusText:
      "BEE is a **highly engaging, application-based course** that **builds smoothly on your 11th and 12th-grade current electricity foundations**, making it an exciting continuation of your prior knowledge. The subject **actively avoids rote memorization**, focusing instead on developing your **logical reasoning and utilizing heavy mathematical calculations** to solve dynamic circuit problems. Because the syllabus is vast and mathematically rigorous, it will **wonderfully push your academic limits** and help you grow as an analytical thinker. To secure a top grade, you should be prepared to dedicate a **fair amount of time outside of class** to practice numericals and explore the teachers' recommended reference books. Furthermore, the course features an **excellent set of hands-on practical applications**, offering a **deeply immersive, lab-heavy experience**. Overall, it is a **highly rewarding course** that provides immense value for anyone who enjoys circuit logic and loves an **active, calculation-driven learning environment**.",
  },

  // 22. DLD
  "26U1ESEB004": {
    courseCode: "26U1ESEB004",
    courseName: "Digital Logic Design",
    aliases: ["DLD", "Digital Logic Design"],
    consensusText:
      "DLD is an **engaging course** that lets you explore a **completely new field** focused on the logical reasoning behind electrical circuits, requiring **very little 11th and 12th-grade background**. The subject is highly logical but surprisingly **relies on heavy memorization**, meaning you must **deeply memorize the step-by-step processes** to solve exam questions rather than relying on pure logic alone. Because the theory is very understandable and the exam checking is generally lenient, the course will **not severely push your academic limits**, making it a **highly reliable GPA booster**. However, you should be prepared to dedicate a **fair amount of time outside of class** to study from external resources like YouTube and manage the demanding overall workload. Unlike purely theoretical subjects, DLD offers **fantastic hands-on practical applications**, featuring **strict and demanding lab sessions** where you will actively build and test real circuit skills. Overall, it is a **highly rewarding course** if you enjoy logical reasoning and are willing to put in the effort for the practical labs.",
  },

  // 23. Engineering Graphics (EG)
  "26U1ESEB005": {
    courseCode: "26U1ESEB005",
    courseName: "Engineering Graphics",
    aliases: ["EG", "Engineering Graphics"],
    consensusText:
      "If you have a passion for design and love creating things visually, Engineering Graphics (EG) is a **fantastic, highly practical course** that lets you explore an **exciting new field** without needing any 11th or 12th-grade background. Instead of memorizing heavy theory or solving complex math equations, you will **dive deeply into spatial concepts and the art of detailed drawing**. The course offers a beautifully immersive experience that will **push your academic limits** by teaching you **real-world discipline and precision**. To truly master these skills, you will get to dedicate **plenty of time outside of class** working on creative, **hands-on drawing sheets and lab assignments**. Because the subject is **so wonderfully practical**, success comes naturally if you practice regularly and enjoy keeping your artwork neat and consistent. Ultimately, it is a **highly rewarding subject that guarantees great grades** for students who love manual drafting and are eager to put in steady, enjoyable effort.",
  },

  // 24. PPP
  "26U1ESEB006": {
    courseCode: "26U1ESEB006",
    courseName: "Product Prototyping Practices",
    aliases: ["PPP", "Product Prototyping Practices"],
    consensusText:
      "PPP is a **unique course** that offers **completely new field exploration**, requiring **absolutely no background** from your 11th and 12th-grade studies. The theoretical side of the subject relies **entirely on pure rote memorization** rather than logical problem-solving or heavy mathematical calculations. Because the theory is just straightforward memorization, it acts as an **easy GPA booster** for some, but it will **severely push your academic limits with boredom** if you dislike 'mugging up' facts. You **will not need to dedicate a heavy amount of time outside of class**, as the overall **workload is highly manageable**. Where the course truly shines is its **active hands-on practical applications**; you will spend significant time in the lab executing **physical tasks like carpentry and basic drawing**. Overall, it is a **highly rewarding course** if you enjoy manual lab work and don't mind memorizing basic theory to secure your grades.",
  },

  // 25. Fundamentals of Corrosion Engineering
  "26U1ESEB007": {
    courseCode: "26U1ESEB007",
    courseName: "Fundamentals of Corrosion Engineering",
    aliases: ["Corrosion", "Fundamentals of Corrosion Engineering"],
    consensusText:
      "Fundamentals of Corrosion Engineering **gently builds on your 11th and 12th-grade chemistry foundations**, offering a balanced mix of **theoretical concepts and tough mathematical numericals**. Because the calculations can be challenging, the course will **slightly push your academic limits** and requires **regular, consistent study** to secure a good CGPA. However, you **won't need to dedicate a heavy amount of time outside of class** searching for resources, as the **professor's PPTs and ChatGPT are completely sufficient** to manage the workload. While there are mandatory laboratory sessions, they **lack active hands-on practical applications**—you will mostly just observe the professor perform demonstrations. Overall, it is a **moderately difficult but highly rewarding course** if you have a genuine interest in applied chemistry.",
  },

  // 26. Geomatic Engineering
  "26U1VSEB001": {
    courseCode: "26U1VSEB001",
    courseName: "Geomatic Engineering",
    aliases: ["Geomatic", "Geomatic Engineering"],
    consensusText:
      "Geomatic Engineering offers solid **new field exploration** into **land surveying, map projections, and computer-aided drafting like AutoCAD**, but it comes with a strong caveat: it is **highly recommended for Civil Engineering students**, while those in CS, AIML, or other branches are **strongly advised to opt for different courses**. It is **not particularly concept-heavy or math-heavy**, as the theoretical portion is quite easy and can be completely managed using just the **professor's PPTs and class notes**. However, the **overall difficulty is moderate** because it is **not considered a very scoring subject for non-Civil students**, and the vivas often require some external knowledge beyond the provided materials. You should expect a **moderate to consistent workload**, as there are weekly assignments that must be completed on time and religiously. The course has a **massive practical focus**, being **extremely lab-heavy**; while the theory is straightforward, the **hands-on lab sessions involving tools like total stations and levels** must be taken very sincerely. Overall, it is a **highly useful core-building course for Civil students**, but a less rewarding elective for everyone else.",
  },

  // 27. Fundamentals of Construction Practices
  "26U1VSEB002": {
    courseCode: "26U1VSEB002",
    courseName: "Fundamentals of Construction Practices",
    aliases: ["FCP", "Construction Practices", "Fundamentals of Construction Practices"],
    consensusText:
      "Fundamentals of Construction Practices is an **accessible, beginner-friendly course** requiring **no prior engineering background**. Devoid of heavy mathematical calculations, it focuses on **descriptive concepts and simple memorization** of technical specifications, making it a **fantastic GPA booster** that will **not severely push your academic limits**. You **won't need to dedicate a heavy amount of time outside of class** to manage the **incredibly light workload**. The course truly shines through its **hands-on practical applications**, where you’ll participate in **exciting site visits**, safely handle physical construction tools, and evaluate real-world building defects. Overall, it is a **highly rewarding, low-stress course** perfect for students across all branches.",
  },

  // 28. Programming for Problem Solving
  "26U1VSEB003": {
    courseCode: "26U1VSEB003",
    courseName: "Programming for Problem Solving",
    aliases: ["PPS", "Programming for Problem Solving", "C Programming"],
    consensusText:
      "Programming for Problem Solving is a **foundational, highly scoring course** that offers essential **new field exploration into the C programming language**. You will learn basic programming constructs that are **absolute must-haves for students entering the CS and AIML domains**. It is a **highly concept-heavy and logical subject**, though be warned that the specific college exams can sometimes lean slightly toward memorization (mugging up); it relies mostly on **logical problem-solving rather than being strictly math-heavy**. The **overall difficulty ranges from easy to moderate** and depends heavily on your background. If you had C or C++ in 11th and 12th grade, you will **breeze through the easy exam papers**, but complete beginners may find it challenging as it is not always taught from absolute scratch. Consequently, your workload will vary; it is minimal for experienced students but requires **significant self-study (up to 60-70%) for newcomers**, alongside a **consistent moderate workload from weekly lab assignments and vivas**. The course maintains a **solid practical focus**, bridging theory from the provided class PPTs with **hands-on coding execution in the labs**. Overall, thanks to **lenient grading**, it is a **great GPA booster and a vital stepping stone for your degree**, with students highly recommending **GeeksforGeeks (GFG)** as the best outside resource to master the basics.",
  },

  // 29. Web Design
  "26U1VSEB004": {
    courseCode: "26U1VSEB004",
    courseName: "Web Design",
    aliases: ["WD", "Web Design"],
    consensusText:
      "Web Design is a **very chill, high-scoring course** that acts as a gentle introduction to web essentials—or a simple refresher if you already took HTML and CSS in your 11th and 12th grades. It offers straightforward **new field exploration for beginners**, teaching everything from the basics of how the web works to **basic Node.js and DOM manipulation using JavaScript**. While you might expect it to be purely hands-on, the course is **surprisingly concept-heavy**, split roughly into **60% theory and 40% coding**. It involves **absolutely no math-heavy calculations**. The **overall difficulty is very low**, making it an **easy GPA booster for students across all branches**. The **workload is minimal**; the labs are relaxed, and grading focuses heavily on your lab assignments, vivas, and a mini-project. It does have a **solid practical focus**, but be warned: you will be asked to **write lengthy pieces of code by hand** during your theory exams. While it is a **perfect course to boost your pointer**, if your main goal is to master real-world web development, taking a dedicated online course might be a better use of your time.",
  },

  // 30. Python Programming
  "26U1VSEB005": {
    courseCode: "26U1VSEB005",
    courseName: "Python Programming",
    aliases: ["Python", "Python Programming"],
    consensusText:
      "Python Programming is a **highly practical and GPA-friendly course** that offers excellent **new field exploration** by introducing you to the world of Python and programming from scratch. You will explore foundational topics like **conditional loops, list comprehensions, dictionaries, and string manipulation**. It is a **concept-heavy course** that focuses on **logical problem-solving rather than rote memorization**. It involves **almost no math-heavy calculations**, making it a great fit if you prefer **active, hands-on coding over solving numerical equations**. The **overall difficulty is easy to moderate**; thanks to a **lenient grading system**, it is considered an **excellent choice for securing a high pointer**, even for students from non-CSE branches. Because you are required to complete lab manuals every week—covering experiments like command-line programs and data manipulation—you should expect a **consistent workload**, but it is **highly manageable** and rarely requires much studying outside of class hours. The course has a **strong practical focus**, ensuring that the theoretical concepts taught in lectures never overpower the **actual hands-on lab experience**. Overall, it is an **engaging, beginner-friendly course** that gives you a solid practical foundation in Python programming without being overly stressful.",
  },

  // 31. Electrical Maintenance and Safety
  "26U1VSEB006": {
    courseCode: "26U1VSEB006",
    courseName: "Electrical Maintenance and Safety",
    aliases: ["EMS", "Electrical Maintenance and Safety"],
    consensusText:
      "Electrical Maintenance and Safety is a **fantastic course** that **builds smoothly on your 11th and 12th-grade fundamentals** while introducing new, industry-focused concepts. The theoretical side relies on a **moderate amount of memorization rather than heavy mathematical calculations**. Because the content is **easy to grasp**, it acts as a **great GPA booster** for those willing to 'mug up' the theory, meaning it will **not severely push your academic limits**. You **won't need to dedicate a heavy amount of time outside of class** to manage the **highly manageable workload**. However, because the exams are straightforward, the **relative grading is competitive**—meaning you must maintain high accuracy to secure a top grade. The course truly shines in its **hands-on practical applications**, offering **excellent real-world exposure to industrial electrical safety**. Overall, it is a **highly rewarding and accessible course** for anyone interested in real-world electrical systems.",
  },

  // 32. Fundamentals of Programmable Logic Controllers (PLC)
  "26U1VSEB007": {
    courseCode: "26U1VSEB007",
    courseName: "Fundamentals of PLC",
    aliases: ["PLC", "Fundamentals of PLC", "Fundamentals of Programmable Logic Controllers (PLC)"],
    consensusText:
      "Fundamentals of Programmable Logic Controllers (PLC) is an instrumentation-related vocational course that offers excellent **new field exploration into industrial automation**, introducing concepts like **Boolean logic and ladder diagrams** that are entirely unrelated to 11th and 12th-grade studies. It is a **highly concept-heavy course**, balancing descriptive hardware memorization with the **active logic required to design control systems**. While it is not overwhelmingly math-heavy, you should be prepared to tackle some **surprisingly tough numericals along the way**. The **overall difficulty is moderate**; because ladder logic relies on **intuitive visual programming** rather than complex text-based syntax, the **learning curve is highly manageable**, though some students may find the theoretical portions a bit dry or boring. You can expect a **steady, manageable workload**, as the course is evaluated continuously through weekly lab sessions where you implement logic for timers and motor starters. Despite the extensive theory, as outlined in the CBCS guiding platform, the course maintains a **massive practical focus**; you will actively apply what you learn to develop ladder logic programs for real-world applications like **tank level control, car parking systems, and object sorting plants**. Overall, it is a **highly useful course** that equips you with **foundational automation skills in a hands-on environment**.",
  },

  // 33. Computer Aided Drafting
  "26U1VSEB008": {
    courseCode: "26U1VSEB008",
    courseName: "Computer Aided Drafting",
    aliases: ["CAD", "Computer Aided Drafting"],
    consensusText:
      "Computer Aided Drafting is a **highly procedural, beginner-friendly course** that offers foundational **new field exploration into digital modeling and engineering graphics**, assuming **absolutely zero prior experience** with coordinate systems or drafting software. It is **moderately concept-heavy**—requiring you to learn orthographic projection theory and memorize specific software commands like **Draw, Modify, and Zoom**—but it is **completely devoid of math-heavy abstract problem-solving**. The **overall difficulty is remarkably low**; because the learning process is step-by-step, the cognitive load stays very manageable even when translating 2D views into 3D models. You should expect a **consistent, low-stress workload** driven largely by **continuous lab assignments rather than heavy outside studying**. The course is built around a **massive practical focus**, meaning you will spend your time actively executing commands to create **real 2D geometric figures and 3D digital models**. Overall, it is an **easy, hands-on vocational course** that equips you with **essential technical drafting skills** without the stress of complex theory.",
  },

  // 34. EV Architecture
  "26U1VSEB009": {
    courseCode: "26U1VSEB009",
    courseName: "EV Architecture",
    aliases: ["EVA", "EV Architecture", "Electric Vehicles"],
    consensusText:
      "EV Architecture is an **engaging vocational course** that offers highly accessible **new field exploration into the evolution of automobiles and modern electric vehicle mechanics**, assuming **absolutely zero prior background** in automotive or electrical engineering. It is a **highly concept-heavy course** that relies heavily on the **descriptive memorization of vehicle layouts, battery technologies, and charging systems**, while involving **virtually zero math-heavy calculations**. While the theoretical side of the course is straightforward, the **overall execution difficulty bumps up to a moderate level** when you enter the workshop. The course maintains a **strong practical focus**; rather than just watching demonstrations, you are required to **physically test motors, measure battery states, and actively dismantle and assemble critical EV components** like the motor, controller, and Battery Management System (BMS). Because handling these parts safely demands physical effort, precision, and strict adherence to procedural steps, you should expect a **consistent, moderate workload** driven by continuous lab evaluations. Overall, it is a **highly rewarding course** that perfectly bridges **basic automotive theory with actual hands-on mechanical experience**.",
  },

  // 35. Manufacturing Practices and Fab Lab (MPFL)
  "26U1VSEB010": {
    courseCode: "26U1VSEB010",
    courseName: "Manufacturing Practices and Fab Lab",
    aliases: ["MPFL", "Manufacturing Practices and Fab Lab", "Fab Lab"],
    consensusText:
      "Manufacturing Practices and Fab Lab (MPFL) is an **easy and engaging course** that offers excellent **new field exploration into basic manufacturing and modern fabrication techniques**. You will explore real-world workshop applications ranging from **carpentry, welding, and lathe machine operations to advanced 3D printing and PCB fabrication**. It is **entirely practical rather than concept-heavy**, and it contains **absolutely no math-heavy numericals**, making it a perfect fit if you prefer **active, physical work over theoretical lectures**. The **overall difficulty is very low**, provided you have the patience for manual tasks like filing, machining, and knurling. Because it is a purely lab-specific course, there is **virtually zero outside workload**; although the lab sessions can be time-consuming, all tasks are completed during your scheduled hours, leaving you free afterward. The course has a **complete practical focus**, offering a **totally hands-on experience with industrial tools and equipment**. Overall, it is a **low-stress, highly rewarding course** that is **perfect for boosting your pointer** if you enjoy hands-on work.",
  },

  // 36. Robotics and Drone Operation and Safety
  "26U1VSEB011": {
    courseCode: "26U1VSEB011",
    courseName: "Robotics and Drone Operation and Safety",
    aliases: ["RDOS", "Robotics and Drone Operation and Safety", "Robotics"],
    consensusText:
      "Robotics and Drone Operation and Safety is an **engaging course** that offers **complete new field exploration**, introducing exciting concepts that are **entirely unrelated to 11th or 12th-grade studies**. It is a **highly concept-heavy subject** covering straightforward, logical theory on robot components, programming, and drone regulations. It is also a great choice if you prefer to avoid calculations, as it has **virtually no math-heavy numericals**. The **overall difficulty is very manageable—ranging from easy to moderate**—because simply understanding the basic principles is usually enough to perform well. While the course has its share of theory, it **shines in its practical focus**; the lab sessions go hand-in-hand with the lectures, culminating in a **highly rewarding final project where you actually build a live robot model**. However, be prepared for a **progressive workload**. While the workload is minimal at the start, it **increases significantly towards the end of the semester** due to the final hands-on model and a high volume of assignments. Although the assignments can be time-consuming, they are doable with focused effort. Overall, it is a **fun, practical course** that is **highly recommended for anyone with a genuine interest in robotics**.",
  },

  // 37. Electrical Workshop
  "26U1VSEB012": {
    courseCode: "26U1VSEB012",
    courseName: "Electrical Workshop",
    aliases: ["EW", "Electrical Workshop"],
    consensusText:
      "Electrical Workshop is an **intense, fully procedural course** that offers foundational **new field exploration into basic tools, standard operating procedures, and physical assembly from the ground up**, requiring **absolutely no prior theoretical knowledge**. It focuses **purely on physical execution rather than being concept-heavy**, and it involves **virtually zero math-heavy calculations**. However, the **overall execution difficulty is surprisingly high and stressful for beginners**; handling **live 415V, 3-phase industrial setups and wiring control panels** introduces severe physical risk and demands intense situational awareness. You should expect a **highly manageable outside workload**, as the course is predominantly evaluated continuously through your weekly lab performance. The course centers entirely on a **massive practical focus**, demanding **zero-margin-for-error precision** as you physically wind transformers, etch printed circuit boards (PCBs), and troubleshoot real-world electrical systems. Overall, it is a **demanding but highly rewarding vocational course** that forces you to **build and execute safely rather than just memorize theory**.",
  },

  // 38. Digital Public Infrastructure
  "26U1VSEB013": {
    courseCode: "26U1VSEB013",
    courseName: "Digital Public Infrastructure",
    aliases: ["DPI", "Digital Public Infrastructure"],
    consensusText:
      "Digital Public Infrastructure is an **incredibly interesting** and **highly scoring** course that offers excellent **new field exploration** into India's digital frameworks. You will explore real-world software domains and industry-level projects. It is very **concept-heavy** rather than **math-heavy**, making it a great fit if you enjoy **application-based learning** instead of solving numerical equations. The overall **difficulty is low**, and the PPTs provided in class are entirely sufficient to help you get good marks on the quizzes and exams. However, because it is so scoring, the **grading curve is highly competitive**; you should expect a **moderate workload** where putting genuine effort into your submissions is key to doing your best. The course also has a **strong practical focus**, featuring hands-on activities and engaging class discussions led by experienced faculty that bring the theory to life. Overall, it is a highly rewarding, **GPA-friendly** course that gives you a valuable understanding of how national digital ecosystems work.",
  },

  // 39. Data Pre-processing and Visualization
  "26U1VSEB014": {
    courseCode: "26U1VSEB014",
    courseName: "Data Preprocessing and Visualization",
    aliases: ["DPV", "Data Pre-processing and Visualization", "Data Preprocessing and Visualization"],
    consensusText:
      "Data Pre-processing and Visualization is an **exceptionally easy and GPA-friendly course**, though it offers relatively limited new field exploration since its foundational concepts rely heavily on **basic statistics already taught in 11th and 12th grade**. The curriculum explores various data charts, dashboard design principles, and dataset cleaning techniques. It is a **concept-heavy and largely theoretical subject rather than a math-heavy one**, completely **avoiding complex calculations** in favor of straightforward principles. The **overall difficulty is extremely low**; it is widely considered an **absolute \"lifesaver\" for your pointer**, and studying just **one night before the exam** is often enough to secure top marks. Your **outside workload will be very low**, though it can depend slightly on your professor's leniency. While the course material feels highly theoretical, it does maintain a **moderate practical focus** involving lab sessions to apply the visualization and pre-processing techniques. Some students find these labs a bit tedious, but they are highly manageable. Overall, it is an **ideal, low-stress elective** for students who want a **guaranteed high grade with minimal study effort**.",
  },
};

/**
 * Retrieve consensus text for a given course code or name.
 * Falls back to the placeholder content if not found.
 */
export function getStudentConsensusText(
  courseCode?: string,
  courseName?: string,
): string {
  if (courseCode && STUDENT_CONSENSUS_DATA[courseCode]) {
    return STUDENT_CONSENSUS_DATA[courseCode].consensusText;
  }

  // Normalized search
  const cleanCode = courseCode?.trim().toLowerCase();
  const cleanName = courseName?.trim().toLowerCase();

  for (const entry of Object.values(STUDENT_CONSENSUS_DATA)) {
    if (cleanCode && entry.courseCode.toLowerCase() === cleanCode) {
      return entry.consensusText;
    }
    if (cleanName && entry.courseName.toLowerCase() === cleanName) {
      return entry.consensusText;
    }
    if (
      entry.aliases.some(
        (alias) =>
          (cleanCode && alias.toLowerCase() === cleanCode) ||
          (cleanName && alias.toLowerCase() === cleanName) ||
          (cleanName && cleanName.includes(alias.toLowerCase())),
      )
    ) {
      return entry.consensusText;
    }
  }

  return PLACEHOLDER_CONSENSUS_TEXT;
}
