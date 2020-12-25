
String.prototype.isEmpty = function() {
  return this.length === 0;
}

const ENDPOINT = 'http://openlibrary.org/search.json?';
const BOOK_COVERS_ENDPOINT = 'http://covers.openlibrary.org/b/id/'; //id/covers_i-S.jpg
const DEFAULT_BOOK_COVER = 'https://via.placeholder.com/130x170/757575/ffffff/?text=No cover';
let Storage = null;
const currentBook = {}; // yes I know it is not ideal. What'ya gonna do?

const attachEvents = () => {
  document.querySelector('#fab-add').addEventListener('click', showAddForm);
  document.querySelector('#cancel').addEventListener('click', hideAddForm);
  document.querySelector('#search-book').addEventListener('click', performSearch);
  document.querySelector('#book-name').addEventListener('keypress', clearMessage);
  document.querySelector('#author-name').addEventListener('keypress', clearMessage);
  document.querySelector('#add-book').addEventListener('click', saveBook);
}

const saveBook = e => {
  e.preventDefault();
  Storage.push('books', currentBook);
  hideAddForm();
  appendBookToShelf(currentBook);
  Snackbar.notify(`Added ${currentBook.details.title} to your bookshelf.`);
  // reset image of the found book
  document.querySelector('#search-results > .book-cover > img').setAttribute('src', DEFAULT_BOOK_COVER);
};

const clearMessage = () => {
  document.querySelector('.message').innerText = '';
}

const performSearch = async e => {
  e.preventDefault();
  if (!validate()) return false;
  updateMessage('Searching...', true);
  const results = await getSearchResults();
  updateMessage('');
  // no book found.
  if (results.count === 0) {
    Snackbar.notify('No book found with these details!');
    currentBook = {};
    return;
  }
  // fill in the book details.
  populateBookDetails(results);
  // populate current book object;
  populateBookObject(results);
  // hide form and show results.
  toggleFormAndResults(true);
}

// pass flag=true to hide the form and show the results and vice-versa it.
const toggleFormAndResults = (flag) => {
  if (flag) {
    // hide "search books header"
    document.querySelector('.add-book-section > h1').style.display = 'none';
    // hide form and show results
    document.querySelector('#add-book-form').classList.add('hidden');
    document.querySelector('#search-book').classList.add('hidden');
    // show the results and add book button
    document.querySelector('#search-results').classList.remove('hidden');
    document.querySelector('#add-book').classList.remove('hidden');
    document.querySelector('#cancel-results').classList.remove('hidden');
  } else {
    // show search books header
    // yeah, midway throught this shit, I was thinking it's getting out of hand.
    // This is precisely why one should use a framework.
    // Now this is a rabbit hole.
    document.querySelector('.add-book-section > h1').style.display = 'block';
    // show the form
    document.querySelector('#add-book-form').classList.remove('hidden');
    document.querySelector('#search-book').classList.remove('hidden');
    document.querySelector('#book-name').focus();
    // hide the results and add book button
    document.querySelector('#search-results').classList.add('hidden');
    document.querySelector('#add-book').classList.add('hidden');
    document.querySelector('#cancel-results').classList.add('hidden');
  }
}

const populateBookObject = result => {
  currentBook.details = {};
  currentBook.details.cover_i = result.details.cover_i;
  currentBook.details.title = result.details.title;
  currentBook.details.author_name = result.details.author_name;
  currentBook.details.publish_year = result.details.publish_year.slice(0,5);
  currentBook.details.subject = result.details.subject ? result.details.subject.slice(0,10) : ['No subject found'];
}

const populateBookDetails = result => {
  const searchResults = document.querySelector('#search-results');
  if (result.details.cover_i) {
    searchResults.querySelector('.book-cover > img').setAttribute('src' ,`${BOOK_COVERS_ENDPOINT}${result.details.cover_i}-L.jpg`);
  }
  searchResults.querySelector('.book-cover > img').setAttribute('alt', result.details.title);
  // update title
  searchResults.querySelector('h3 > a').innerText = result.details.title;
  searchResults.querySelector('h3 > a').setAttribute('href',  result.details.title);
  // udpate author
  searchResults.querySelector('h5').innerText = result.details.author_name.join(',');
  // update published years
  searchResults.querySelector('.published-years').innerText = result.details.publish_year.slice(0,5).join(',');
  // udpate the chips
  searchResults.querySelector('ul.chips-container').innerHTML = chipsFactory(
    result.details.subject ? result.details.subject.slice(0,10): ['No subject found']
  );
}

const chipsFactory = items => {
  return items.map(item => `<li class="chip">${item}</li>`).join('');
}

const encode = param => encodeURIComponent(param).replace(/%20/g, "+");

const getSearchResults = async () => {
  const name = document.querySelector('#book-name').value.trim();
  const author = document.querySelector('#author-name').value.trim();
  try {
    const res = await fetch(`${ENDPOINT}title=${encode(name)}&author=${encode(author)}`);
    const result = await res.json();
    const response = {
      count: result.numFound,
      message: null,
      details: null,
    };

    if (result.count === 0)
      response.message = 'Nothing found. Please check the book/author name again.';
    else {
      response.details = result.docs[0];
    }
    return response;
  } catch (error) {
    throw error;
  }
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

const clearForm = () => {
  document.querySelectorAll('#add-book-form input').forEach(input => input.value = '');
}

const showAddForm = () => {
  clearForm();
  document.querySelector('.add-book-section').classList.remove('hidden');
  // hide the no-book found message.
  document.querySelector('.book-shelf > h2').style.display = 'none';
  toggleFormAndResults(false);
}

const hideAddForm = () => {
  document.querySelector('.add-book-section').classList.add('hidden');
  // hide the no-book found message.
  document.querySelector('.book-shelf > h2').style.display = 'block';
  toggleFormAndResults(true);
}

const init = () => {
  initBooksStorage();
  attachEvents();
}
class Snackbar {
  static host = document.querySelector('#snackbar-host');
  static count = 0;
  static delay = 5000;

  static notify(message) {
    let snack = `<div class="snackbar">${message}</div>`;
    // dummy to get html string as a dom elem.
    const dummy = document.createElement('div');
    dummy.innerHTML = snack;
    snack = Snackbar.host.appendChild(dummy.firstChild);
    snack.classList.add('appear');
    Snackbar.count++;
    // set it to disappear after a delay.
    setTimeout(() => {
      snack.classList.remove('appear');
      snack.classList.add('disappear');
      snack.addEventListener('transitionend', e => {
        Snackbar.host.removeChild(snack);
        Snackbar.count--;
      });
    }, Snackbar.delay);
  }
}

const getBookCoverSource = cover_id => 
  cover_id ? `${BOOK_COVERS_ENDPOINT}${cover_id}-M.jpg` : 'https://via.placeholder.com/130x170/757575/ffffff/?text=No cover';

const appendBookToShelf = book => {
  const bookDom = `<article class="book">
    <div class="book-cover-small">
      <img src="${getBookCoverSource(book.details.cover_i)}" alt="${book.details.title}" />
    </div>
    <div class="details-small">
      <h4 title="${book.details.title}" class="truncate">${book.details.title}</h4>
      <h5 class="author-name truncate">${book.details.author_name.join(',')}</h5>
    </div>
  </article>`;
  const dummyDiv = document.createElement('div');
  dummyDiv.innerHTML = bookDom;
  const addedBook = document.querySelector('.books-grid').appendChild(dummyDiv.firstChild);
  addedBook.classList.add('appear');
}

// wait for doc load.
document.addEventListener('DOMContentLoaded', init);

const initBooksStorage = () => {
  Storage = new xStore('neo:', localStorage);
  const storedBooks = Storage.get('books');
  if (!storedBooks || storedBooks.length === 0) {
    Storage.set('books', []);
  } else {
    document.querySelector('.book-shelf > h2').innerText = 'Here\'s your collection... ';
    storedBooks.forEach(book => appendBookToShelf(book));
  }
}
