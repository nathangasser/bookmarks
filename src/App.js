import './App.css';

import React from 'react';
import { API, graphqlOperation } from 'aws-amplify';
import { listBookmarks } from './graphql/queries';
import { createBookmark, deleteBookmark } from './graphql/mutations';
import { onCreateBookmark } from './graphql/subscriptions';

class App extends React.Component {
  state = {
    name: '',
    url: '',
    description: '',
    bookmarks: []
  };

  onChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  }

  createBookmark = async () => {
    const { name, url, description } = this.state;
    if (name === '' || url === '') return;
    try {
      const bookmark = { name, url, description };
      const bookmarks = [...this.state.bookmarks, bookmark];
      this.setState({ bookmarks, name: '', url: '', description: '' });
      await API.graphql(graphqlOperation(
        createBookmark,
        { input: bookmark }
      ));
    } catch (err) {
      console.log('error: ', err);
    }
  }

  deleteBookmark = async (bookmarkId) => {
    const bookmarks = [
      ...this.state.bookmarks.filter(b => b.id !== bookmarkId)
    ];
    try {
      await API.graphql(graphqlOperation(
        deleteBookmark,
        {
          input: {
            id: bookmarkId
          }
        }
      ));
    } catch (err) {
      console.log('error: ', err);
    }
    this.setState({ bookmarks });
  }

  async componentDidMount() {
    try {
      const apiData = await API.graphql(graphqlOperation(listBookmarks));
      const bookmarks = apiData.data.listBookmarks.items;
      this.setState({ bookmarks });
    } catch (err) {
      console.log('error: ', err);
    }
    
    this.subscribeOnCreate = API.graphql(
      graphqlOperation(onCreateBookmark)
    ).subscribe({
      next: (bookmarkData) => {
        const bookmark = bookmarkData.value.data.onCreateBookmark;
        const bookmarks = [
          ...this.state.bookmarks.filter(b => {
            return (
              b.name !== bookmark.name && b.url !== bookmark.url && b.description !== bookmark.description
            );
          }),
          bookmark
        ];
        this.setState({ bookmarks });
      }
    });
  }

  componentWillUnmount() {
    this.subscribeOnCreate.unsubscribe();
  }

  render() {
    return (
      <div className="App">
        <div style={styles.inputContainer}>
          <input
            name='name'
            placeholder='bookmark name'
            onChange={this.onChange}
            value={this.state.name}
            style={styles.input}
          />
          <input
            name='url'
            placeholder='https://example.com'
            onChange={this.onChange}
            value={this.state.url}
            style={styles.input}
          />
          <input
            name='description'
            placeholder='description of bookmark'
            onChange={this.onChange}
            value={this.state.description}
            style={styles.input}
          />
        </div>
        <button
          style={styles.button}
          onClick={this.createBookmark}
        >
          Create Bookmark
        </button>
        {
          this.state.bookmarks.map((bookmark, i) => (
            <div style={styles.item} key={i}>
              <p style={styles.name}><a href={bookmark.url}>{bookmark.name}</a></p>
              <p style={styles.description}>{bookmark.description}</p>
              <button onClick={() => this.deleteBookmark(bookmark.id)}>Delete</button>
            </div>
          ))
        }
      </div>
    );
  } 
}

const styles = {
  item: {
    padding: 10,
    borderBottom: '2px solid #ddd'
  },
  name: {
    fontSize: 22
  },
  description: {
    color: 'rgba(0, 0, 0, .45)'
  },
  inputContainer: {
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    width: 300
  },
  button: {
    border: 'none',
    backgroundColor: '#ddd',
    padding: '10px 30px'
  },
  input: {
    fontSize: 18,
    border: 'none',
    margin: 10,
    height: 35,
    backgroundColor: '#ddd',
    padding: 8
  }
};

export default App;
