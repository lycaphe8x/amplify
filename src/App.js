import React, { useState, useEffect } from 'react';
import './App.css';
import { Amplify } from 'aws-amplify';
import { awsExports } from './aws-exports';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Auth } from "aws-amplify";
import { Hub } from 'aws-amplify';


Amplify.configure({
  Auth: {
    region: awsExports.REGION,
    userPoolId: awsExports.USER_POOL_ID,
    userPoolWebClientId: awsExports.USER_POOL_APP_CLIENT_ID
  }
});

function App() {
  const [jwtToken, setJwtToken] = useState('');
  const [sayText, setSayText] = useState('');
  const [books, setBooks] = useState([]);
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState(null);

  // Lấy jwtToken từ localStorage khi trang tải
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      setJwtToken(token);
    }
  }, []);

  useEffect(() => {
    // Nghe sự kiện xác thực
    const listener = Hub.listen('auth', (data) => {
      const { payload } = data;
      if (payload.event === 'signIn') {
        // Người dùng đã đăng nhập, lấy token
        fetchJwtToken();

        // // Gọi API sayHello
        // fetch("/sayHello", {
        //   headers: {
        //     Authorization: `Bearer ${jwtToken}`,  // Thay `jwtToken` bằng token JWT của bạn
        //   },
        // })
        //   .then((response) => response.json())
        //   .then((data) => {
        //     console.log("Hello message:", data.message);
        //   })
        //   .catch((error) => {
        //     console.log("Error fetching hello message:", error);
        //   });

        // fetch('https://udv2vqc0fh.execute-api.us-east-1.amazonaws.com/beta/hello', )
        // Gọi API sayHello
        // fetch("https://udv2vqc0fh.execute-api.us-east-1.amazonaws.com/beta/hello", {
        //     headers: {
        //       Authorization: `Bearer ${jwtToken}`,  // Thay `jwtToken` bằng token JWT của bạn
        //     },
        //   })
        //   .then(response => response.json())
        //   .then(data => {
        //     console.log("Received greeting:", data.body);
        //   })
        //   .catch(error => {
        //     console.log("Error fetching greeting:", error);
        //   });
      }
    });

    // Xóa listener khi component unmount
    return () => listener();
  }, []);

  const analyzeSentiment = () => {
    fetch('https://udv2vqc0fh.execute-api.us-east-1.amazonaws.com/beta/sentimen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ text })
    })
    .then(response => response.json())
    .then(data => setSentiment(data))
    .catch(error => console.log('Error analyzing sentiment:', error));
  };


  const fetchJwtToken = async () => {
    try {
      // const user = await Auth.currentAuthenticatedUser(); // Check if user is signed in
      const session = await Auth.currentSession(); // Get user session
      const token = session.getIdToken().getJwtToken(); // Extract JWT token from session
      setJwtToken(token);
      localStorage.setItem('jwtToken', token);  // Lưu vào localStorage
    } catch (error) {
      if (error === 'No current user') {
        // Redirect to sign-in page, or handle accordingly
        console.log('User not signed in');
      } else {
        console.log('Error fetching JWT token:', error);
      }
    }
  };

  const fetchBooks = async () => {
    try {
      //say hello
      // const response = await fetch("https://udv2vqc0fh.execute-api.us-east-1.amazonaws.com/beta/hello", {
      //       headers: {
      //         Authorization: `Bearer ${jwtToken}`,  // Thay `jwtToken` bằng token JWT của bạn
      //       },
      // })
      //books
      const response = await fetch("https://udv2vqc0fh.execute-api.us-east-1.amazonaws.com/beta/books", {
            headers: {
              Authorization: `Bearer ${jwtToken}`,  // Thay `jwtToken` bằng token JWT của bạn
            },
      })
      const data = await response.json();
      // const sayTextData = JSON.parse(data.body); // Phân tích cú pháp dữ liệu JSON từ trường 'body'
      const booksData = JSON.parse(data.body); // Phân tích cú pháp dữ liệu JSON từ trường 'body'
      // console.log(sayTextData);
      console.log(booksData);
      // setSayText(booksData);
      setBooks(booksData);
    } catch (error) {
      console.log('Error fetching books:', error);
    }
  };

  // Fetch books when jwtToken changes
  // useEffect(() => {
  //   if (jwtToken) {
  //     fetchBooks();
  //   }
  // }, [jwtToken]);

  useEffect(() => {
  if (jwtToken) {
    fetch('https://udv2vqc0fh.execute-api.us-east-1.amazonaws.com/beta/books', {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    })
    .then(response => {
      if (response.status === 401) {
        // Token hết hạn, làm mới token tại đây
        fetchJwtToken();  // Gọi lại hàm fetchJwtToken() để lấy token mới
      }
      return response.json();
    })
    .then(data => {
      if (data) {
        const booksData = JSON.parse(data.body); // Phân tích cú pháp dữ liệu JSON từ trường 'body'
        setBooks(booksData);
      }
    })
    .catch(error => console.log('Error fetching books:', error));
  }
}, [jwtToken]);

  const handleSignOut = async () => {
    try {
      await Auth.signOut();
      setJwtToken(''); // Clear the state
      localStorage.removeItem('jwtToken'); // Remove from localStorage
    } catch (error) {
      console.log('Error signing out:', error);
    }
  };

  return (
    <Authenticator loginMechanisms={['email']} initialState='signIn'
    components={{
      SignUp: {
        FormFields() {
          return (
            <>
              <Authenticator.SignUp.FormFields />

              {/* Custom fields for given_name and family_name */}
              <div><label>First name</label></div>
              <input
                type="text"
                name="given_name"
                placeholder="Please enter your first name"
              />
              <div><label>Last name</label></div>
              <input
                type="text"
                name="family_name"
                placeholder="Please enter your last name"
              />
              <div><label>Email</label></div>
              <input
                type="text"
                name="email"
                placeholder="Please enter a valid email"
              />
            </>
          );
        },
      },
    }}
    services={{
      async validateCustomSignUp(formData) {
        if (!formData.given_name) {
          return {
            given_name: 'First Name is required',
          };
        }
        if (!formData.family_name) {
          return {
            family_name: 'Last Name is required',
          };
        }
        if (!formData.email) {
          return {
            email: 'Email is required',
          };
        }
      },
    }}
    >
      {({ signOut, user}) => (
        <div>Welcome {user.username}
        <button onClick={handleSignOut}>Sign out</button>
        <h4>Your JWT token:</h4>
        {jwtToken}
          <br/>
          <br/>
          <div>
            <label htmlFor="text-input">Enter Text for Sentiment Analysis:</label>
            <input
              id="text-input"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button onClick={analyzeSentiment}>Analyze</button>
            {sentiment && (
              <div>
                <h4>Sentiment Analysis Result:</h4>
                <p>{sentiment.body}</p>
              </div>
            )}
          </div>

          <h2>Books:</h2>
         <div className="book-container">
        {books.map((book, index) => (
          <div className="book-item" key={index}>
            <h3>{book.name}</h3>
            <p>Author: {book.author}</p>
            <p>Price: {book.price}</p>
          </div>
        ))}
      </div>

        </div>

      )}

    </Authenticator>
  );
}

export default App;
