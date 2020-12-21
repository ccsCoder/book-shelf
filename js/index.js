
String.prototype.isEmpty = function() {
  return this.length === 0;
}

const ENDPOINT = 'http://openlibrary.org/search.json?';
const BOOK_COVERS_ENDPOINT = 'http://covers.openlibrary.org/b/id/'; //id/covers_i-S.jpg

const attachEvents = () => {
  document.querySelector('#fab-add').addEventListener('click', showAddForm);
  document.querySelector('#cancel').addEventListener('click', hideAddForm);
  document.querySelector('#search-book').addEventListener('click', performSearch);
  document.querySelector('#book-name').addEventListener('keypress', clearMessage);
  document.querySelector('#author-name').addEventListener('keypress', clearMessage);

}

const clearMessage = () => {
  document.querySelector('.message').innerText = '';
}

const performSearch = async e => {
  e.preventDefault();
  if (!validate()) return false;
  
  const results = await getSearchResults();
  console.log(results);
}

const encode = param => encodeURIComponent(param).replace(/%20/g, "+");

const getSearchResults = () => {
  const name = document.querySelector('#book-name').value.trim();
  const author = document.querySelector('#author-name').value.trim();
  return fetch(`${ENDPOINT}title=${encode(name)}&author=${encode(author)}`)
  .then(res => res.json())
  .then(result => {
    const response = {
      count: result.numFound,
      message: null,
      details: null,
    };

    if (result.count === 0) response.message = 'Nothing found. Please check the book/author name again.';
    else {
      response.details = result.docs[0];
    }
    return response;
  })
  .catch(error => {
    throw error;
  });
}

const validate = () => {
  const name = document.querySelector('#book-name').value.trim();
  const author = document.querySelector('#author-name').value.trim();

  if (name.isEmpty()) {
    updateMessage('Please enter a valid book name');
    return false;
  }

  if (author.isEmpty()) {
    updateMessage('Please enter a valid author name');
    return false;
  }
  return true;

}

const updateMessage = (message, isSuccess = false) => {
  const messageElem = document.querySelector('.message');
  messageElem.classList.add(isSuccess ? 'success': 'error');
  messageElem.innerText = message;
}

const showAddForm = () => {
  const addBookSection = document.querySelector('.add-book-section');
  addBookSection.style.visibility = 'visible';
  addBookSection.style.top = '0';
  addBookSection.querySelector('input').focus();
}

const hideAddForm = () => {
  const addBookSection = document.querySelector('.add-book-section');
  addBookSection.style.visibility = 'hidden';
  addBookSection.style.top = '-300px';
  addBookSection.querySelector('input').blur();
}

const init = () => {
  attachEvents();
}

// wait for doc load.
document.addEventListener('DOMContentLoaded', init);