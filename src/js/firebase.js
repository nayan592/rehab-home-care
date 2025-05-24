// // Your Firebase config here
// const firebaseConfig = {
//   apiKey: "AIzaSyCbzuu2wUiiz3SYcsns7-lyCBMAl6emqWw",
//   authDomain: "rehab-home-care.firebaseapp.com",
//   projectId: "rehab-home-care",
//   appId: "1:464642242934:web:e9a2c2be98775f25d8a257",
//   storageBucket: "rehab-home-care.firebasestorage.com",
//   messagingSenderId: "464642242934",
// measurementId: "G-S1SE4SZ2TW"
// };

// // Initialize Firebase
// firebase.initializeApp(firebaseConfig);
// const auth = firebase.auth();

// // Initialize Firestore (assuming you want to save user info)
// const db = firebase.firestore();  // <-- add this line

// function login() {
//   console.log("In login function");
//   const email = document.getElementById("email").value;
//   const password = document.getElementById("password").value;
//   const message = document.getElementById("message");

//   if (!email || !password) {
//     message.style.color = "red";
//     message.textContent = "Please enter both email and password.";
//     return;
//   }

//   auth.signInWithEmailAndPassword(email, password)
//     .then((userCredential) => {
//       message.style.color = "green";
//       message.textContent = "Login successful!";

//       // Redirect to index.html after 1 second
//       setTimeout(() => {
//         window.location.href = "index.html";
//       }, 1000);

//       console.log("User:", userCredential.user);
//     })
//     .catch((error) => {
//       message.style.color = "red";
//       message.textContent = error.message;
//     });
// }

// async function signUp() {
//   const email = document.getElementById("email").value;
//   const password = document.getElementById("password").value;
//   const phone = document.getElementById("phone").value;
//   const message = document.getElementById("message");

//   if (!email || !password || !phone) {
//     message.style.color = "red";
//     message.textContent = "All fields are required!";
//     return;
//   }

//   try {
//     const userCredential = await auth.createUserWithEmailAndPassword(email, password);
//     const user = userCredential.user;

//     // Save to Firestore
//     await db.collection("users").doc(user.uid).set({
//       uid: user.uid,
//       email: user.email,
//       phone: phone,
//       provider: "email"
//     });

//     message.style.color = "green";
//     message.textContent = "User created successfully!";
//   } catch (error) {
//     message.style.color = "red";
//     message.textContent = error.message;
//   }
// }

// async function googleSignUp() {
//   const provider = new firebase.auth.GoogleAuthProvider();
//   try {
//     const result = await auth.signInWithPopup(provider);
//     const user = result.user;

//     // Save to Firestore
//     await db.collection("users").doc(user.uid).set({
//       uid: user.uid,
//       email: user.email,
//       phone: user.phoneNumber || "N/A",
//       provider: "google"
//     });

//     const message = document.getElementById("message");
//     message.style.color = "green";
//     message.textContent = "Signed in with Google!";
//   } catch (error) {
//     const message = document.getElementById("message");
//     message.style.color = "red";
//     message.textContent = error.message;
//   }
// }

// // Update login button on auth state change
// auth.onAuthStateChanged(function(user) {
//   const authButton = document.getElementById('authButton');

//   if (authButton) {
//     if (user) {
//       authButton.textContent = "My Profile";
//       authButton.href = "../public/profile.html"; // Your profile page
//       authButton.classList.remove("btn-outline-primary");
//       authButton.classList.add("btn-success");
//     } else {
//       authButton.textContent = "Log In";
//       authButton.href = "../public/login.html";
//       authButton.classList.remove("btn-success");
//       authButton.classList.add("btn-outline-primary");
//     }
//   }
// });
// Your Firebase config here
const firebaseConfig = {
  apiKey: "AIzaSyCbzuu2wUiiz3SYcsns7-lyCBMAl6emqWw",
  authDomain: "rehab-home-care.firebaseapp.com",
  projectId: "rehab-home-care",
  storageBucket: "rehab-home-care.firebasestorage.app",
  messagingSenderId:  "464642242934",
  appId:  "1:464642242934:web:e9a2c2be98775f25d8a257",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Initialize Firestore (assuming you want to save user info)
const db = firebase.firestore();

function login() {
  console.log("In login function");
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const message = document.getElementById("message");

  if (!email || !password) {
    message.style.color = "red";
    message.textContent = "Please enter both email and password.";
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      message.style.color = "green";
      message.textContent = "Login successful!";

      // Redirect to index.html after 1 second
      // setTimeout(() => {
      //   window.location.href = "index.html";
      // }, 1000);

      console.log("User:", userCredential.user);
    })
    .catch((error) => {
      message.style.color = "red";
      message.textContent = error.message;
    });
}

async function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const phone = document.getElementById("phone").value;
  const message = document.getElementById("message");
  const name = document.getElementById("name");

  if (!email || !password || !phone || !name) {
    message.style.color = "red";
    message.textContent = "All fields are required!";
    return;
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Save to Firestore
    await db.collection("users").doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      phone: phone,
      provider: "email",
      user_name : name,
    });

    message.style.color = "green";
    message.textContent = "User created successfully!";
  } catch (error) {
    message.style.color = "red";
    message.textContent = error.message;
  }
}

async function googleSignUp() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    const user = result.user;

    // Save to Firestore
    await db.collection("users").doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      phone: user.phoneNumber || "N/A",
      provider: "google"
    });

    const message = document.getElementById("message");
    message.style.color = "green";
    message.textContent = "Signed in with Google!";
  } catch (error) {
    const message = document.getElementById("message");
    message.style.color = "red";
    message.textContent = error.message;
  }
}

// Update login button on auth state change
auth.onAuthStateChanged(function(user) {
  const authButton = document.getElementById('authButton');

  if (authButton) {
    if (user) {
      authButton.textContent = "My Profile";
      authButton.href = "../public/profile.html"; // Your profile page
      authButton.classList.remove("btn-outline-primary");
      authButton.classList.add("btn-success");
    } else {
      authButton.textContent = "Log In";
      authButton.href = "../public/login.html";
      authButton.classList.remove("btn-success");
      authButton.classList.add("btn-outline-primary");
    }
  }
});
