const colors = {
  dark: '#10122d',
  light: '#fff',
  pink: '#f6388a',
  purple: '#7b1173',
}
module.exports.styles = {
  bg: {
    backgroundColor: colors.dark
  },
  centered: {
    margin: '0 auto',
    textAlign: 'center'
  },
  button_group: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    flexWrap: 'wrap',
    alignItems: 'space-between',
    justifyContent: 'center',
    margin: '0 auto'
  }
}
module.exports.colors = colors;
module.exports.initialStyleString = `
h1, h2, h3, h4, h5, h6, p, a, button, label {
  font-family: Poppins;
  color: ${colors.light};
}
h1 {
  font-weight: 700;
  letter-spacing: 0.07em;
}
button, p, a, label {
  font-weight: 300
}
body {
  margin: 0;
  background-color: ${colors.dark};

}
button {
  font-family: "Poppins", sans-serif;
  font-size: 12px;
  line-height: 46px;
  font-weight: 600;
  padding: 0 0;
  text-align: center;
  text-transform: uppercase;
  color: #fff;
  min-width: 160px;
  max-width: 100%;
  border: none;
  box-sizing: border-box;
  transition: all 0.5s;
  position: relative;
  z-index: 2;
  -ms-border-radius: 23px;
  border-radius: 23px;
  background-image: -webkit-linear-gradient(left, #7b1173 0%, #f6388a 100%);
  background-image: linear-gradient(to right, #7b1173 0%, #f6388a 100%);
  margin: 10px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
}
button:hover, button:focus {
  text-decoration: none;
  color: #fff;
  outline: none;
  box-shadow: none;
  cursor: pointer;
  background-image: linear-gradient(to right, #46bdf4 0%, #7b1173 100%);
  transform: translateX(15px);
}

button:active {
  background-color: #46bdf4;
  background-image: linear-gradient(to right, #46bdf4 0%, #7b1173 100%);
}

input {
  position: relative;
  line-height: 46px;
  z-index: 2;
  background: transparent;
  border: none;
  width: 100%;
  text-align: center;
  color: #fff;
  border-bottom: 1px solid #46bdf4;
  margin-top: 8px;
  outline: none;
  border-bottom-color: #f6388a;
  color: #fff;

  text-rendering: auto;
  letter-spacing: normal;
  word-spacing: normal;
  text-transform: none;
  text-indent: 0px;
  text-shadow: none;
  display: inline-block;
  margin: 0em;
  font-size: 1.1em;

}

label {
  position: absolute;
  width: 100%;
  top: 18px;
  left: 0;
  color: #8284a5;
  z-index: 1;
  transition: all .5s ease;
  display: inline-block;
  margin-bottom: .5rem;
}

#loader { display: block; position: relative; left: 50%; top: 50%; width: 70px; height: 70px; margin: -35px 0 0 -35px; border-radius: 50%; border: 2px solid transparent; border-top-color: ${colors.pink}; -webkit-animation: spin 2s linear infinite; animation: spin 2s linear infinite; z-index: 1001; }

#loader:before { content: ""; position: absolute; top: 5px; left: 5px; right: 5px; bottom: 5px; border-radius: 50%; border: 3px solid transparent; border-top-color: #7a0fff; -webkit-animation: spin 3s linear infinite; animation: spin 3s linear infinite; }

#loader:after { content: ""; position: absolute; top: 15px; left: 15px; right: 15px; bottom: 15px; border-radius: 50%; border: 3px solid transparent; border-top-color: #2b56f5; -webkit-animation: spin 1.5s linear infinite; animation: spin 1.5s linear infinite; }

.loader-section { position: fixed; height: 51%; width: 100%; left: 0; transition: all .7s ease; background: ${colors.dark}; }
.io-azure .loader-section { background: ${colors.dark}; }
.loader-top { top: 0; }
.loaded .loader-top { transform: translate(0, -100%); }
.loader-bottom { bottom: 0; }
.loaded .loader-bottom { transform: translate(0, 100%); }

@keyframes spin { 0% { -webkit-transform: rotate(0deg); -ms-transform: rotate(0deg); transform: rotate(0deg); }
  100% { -webkit-transform: rotate(360deg); -ms-transform: rotate(360deg); transform: rotate(360deg); } }

`
