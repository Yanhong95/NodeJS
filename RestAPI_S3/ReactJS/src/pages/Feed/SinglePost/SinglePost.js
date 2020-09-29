import React, { Component } from 'react';
import Button from '../../../components/Button/Button'
import Image from '../../../components/Image/Image';
import './SinglePost.css';

class SinglePost extends Component {
  state = {
    _id: '',
    title: '',
    author: '',
    date: '',
    image: '',
    content: ''
  };

  componentDidMount() {
    const postId = this.props.match.params.postId;
    const graoqlQuery = {
      query: `
      query {
        getPost(id: "${postId}"){
          _id
          title
          content
          imageUrl
          creator{
            name
          }
          createdAt
        }
      }
      `
    }
    fetch(`http://localhost:8080/graphql`, {
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(graoqlQuery)
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if (resData.errors) {
          console.log(resData.errors);
          throw new Error('Get post failed!');
        }
        console.log(resData);
        this.setState({
          _id: resData.data.getPost._id,
          title: resData.data.getPost.title,
          author: resData.data.getPost.creator.name,
          image: resData.data.getPost.imageUrl,
          date: new Date(resData.data.getPost.createdAt).toLocaleDateString('en-US'),
          content: resData.data.getPost.content
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  onDownload = async () => {
    const postId = this.state._id;
    const response = await fetch(`http://localhost:8080/imageDownload?postId=${postId}`,{
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
      }
    });
    const resBody = await response.blob();
    const url = window.URL.createObjectURL(new Blob([resBody]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', this.state.image.split("/").pop()); //or any other extension
    document.body.appendChild(link);
    link.click();
  }

  render() {
    return (
      <section className="single-post">
        <h1>{this.state.title}</h1>
        <h2>
          Created by {this.state.author} on {this.state.date}
        </h2>
        <div className="single-post__image">
          <Image contain imageUrl={this.state.image} />
        </div>
        <Button mode="raised" onClick={this.onDownload}> Download </Button>
        <br />
        <div>{this.state.content}</div>
      </section>
    );
  }
}

export default SinglePost;
