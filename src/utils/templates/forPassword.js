export const passwordMsgTemplate = (password) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
    <style>
    body {
      font-family: 'Lato', sans-serif;
      font-style: normal;
      font-size: 14px;
    }
    .container {
      padding: 2rem;
      border: 1px solid ghostwhite;
      min-width: 2rem;
      display: inline-block;
      background-clip: padding-box;
      background-image: linear-gradient(180deg,#a8adba 0%, rgba(0, 0, 0, 0.01) 70%);
      color: rgb(46, 46, 46);
    }
    .intro {
      font-size: 1.2rem;
    }
    .password {
      font-size: 2rem;
      color: rgb(12, 12, 63);
    }
    .note_to-change-password {
      color: rgb(12, 12, 63);
    }
    .note_that-password-expires {
      display: block;
      color: rgb(181, 45, 45);
    }
    .timestamp {
      display: block;
      font-size: 8px;
      margin-top: 5px;
    }
      </style>
    </head>
    <body>
      <div class="container">
        <p class="intro">Dear Sir/Madam,</p>
        <div class="msg-body">
          A new account has been created for you on the Integrated H.I.M System. Below is your new password:</br>
          <p class="password">${password}</p>
         <p class="note_to-change-password">Please note that you are required to login and change the password in order to use the application.</p>
         <i class="note_that-password-expires">This password will expire after 24 hours. Kindly ensure utmost confidentiality.</i>
         <hr />
         <i class="timestamp">Account Created On: ${new Date()}</i>
        </div>
      </div>
    </body>
  </html>
  `;
};

export const passwordResetTokenTemplate = (token) => {
  const link = process.env.HOST_URL_FRONTEND + '/' + token;
  return `
  <!DOCTYPE html>
  <html>
    <head>
    <style>
    body {
      font-family: 'Lato', sans-serif;
      font-style: normal;
      font-size: 14px;
    }
    .container {
      padding: 2rem;
      border: 1px solid ghostwhite;
      min-width: 2rem;
      display: inline-block;
      background-clip: padding-box;
      background-image: linear-gradient(180deg,#a8adba 0%, rgba(0, 0, 0, 0.01) 70%);
      color: rgb(46, 46, 46);
    }
    .intro {
      font-size: 1.2rem;
    }
    .token {
      font-size: 1rem;
      color: rgb(12, 12, 63);
      margin: 1.5rem 0;
      display: block;
    }
    .note_to-change-password {
      color: rgb(12, 12, 63);
    }
    .note_that-password-expires {
      display: block;
      color: rgb(181, 45, 45);
    }
    .timestamp {
      display: block;
      font-size: 8px;
      margin-top: 5px;
    }
      </style>
    </head>
    <body>
      <div class="container">
        <p class="intro">Dear Sir/Madam,</p>
        <div class="msg-body">
          Please click on the link below to reset your password
          </br>
          <a class="token" href="${link}" target="branch">
              ${link}
          </a>
          <p class="note_to-change-password">
              If you did not initiate this request, please contact the DHML IT department immidiately.
          </p>
          <i class="note_that-password-expires">
              Kindly note that this link is only valid for 15 minutes.
          </i>
          <hr />
          <i class="timestamp">Time of request: ${new Date()}</i>
        </div>
      </div>
    </body>
  </html>
  `;
};
