
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
  updateMessage('Searching...', true);
  const results = await getSearchResults();
  updateMessage('');
  // no book found.
  if (results.count === 0) {
    updateMessage(results.message);
    return;
  }
  // fill in the book details.
  populateBookDetails(results);
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
    // This is precisely why one should use a frwk.
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

const showAddForm = () => {
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

// const createChip = chipText 

const init = () => {
  attachEvents();
}

// wait for doc load.
document.addEventListener('DOMContentLoaded', init);