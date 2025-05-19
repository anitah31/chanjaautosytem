// Wait for both DOM and Firebase to be ready
function whenReady(callback) {
  if (window.auth && window.db) {
    callback();
  } else {
    const interval = setInterval(() => {
      if (window.auth && window.db) {
        clearInterval(interval);
        callback();
      }
    }, 100);
  }
}

whenReady(() => {
  console.log("Firebase and DOM are ready");
  
  const { auth, db, firestore } = window;

  // Login Form Handler
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const submitBtn = e.target.querySelector('button[type="submit"]');
      
      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        
        // Authenticate user
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Store login activity
        await db.collection('loginActivities').add({
          userId: user.uid,
          email: email,
          status: 'success',
          timestamp: firestore.FieldValue.serverTimestamp()
        });
        
        // Update user document
        await db.collection('users').doc(user.uid).update({
          lastLogin: firestore.FieldValue.serverTimestamp()
        });
        
        window.location.href = 'dashboard.html';
      } catch (error) {
        console.error('Login error:', error);
        alert(`Login failed: ${error.message}`);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Login';
        }
      }
    });
  }

  // Signup Form Handler
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('newUsername').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('newPassword').value;
      const submitBtn = e.target.querySelector('button[type="submit"]');
      
      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
        
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        
        // Create user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Create user profile
        await db.collection('users').doc(user.uid).set({
          username: username,
          email: email,
          createdAt: firestore.FieldValue.serverTimestamp(),
          role: 'admin'
        });
        
        // Send verification email
        await user.sendEmailVerification();
        
        alert('Account created! Please verify your email.');
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Signup error:', error);
        alert(`Signup failed: ${error.message}`);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign Up';
        }
      }
    });
  }
});