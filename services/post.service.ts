import {
  GetPostResponse,
  GetPostsQueryParams, Post, Response
} from '../models';
import {
  mapResponseToPost,
} from '../models/mappers';

export const getPosts = async (
  params?: GetPostsQueryParams
): Promise<GetPostResponse> => {
  const queryParams = new URLSearchParams({
    limit: String(params?.limit || 5),
    offset: String(params?.offset || 0),
    newerThan: params?.newerThanMumbleId || '',
    olderThan: params?.olderThanMumbleId || '',
  });

  const headers = new Headers();
  headers.append('Content-Type', 'application/json');

  const url = `${process.env.NEXT_PUBLIC_QWACKER_API_URL}/posts?${queryParams}`;
  const res = await fetch(url, { headers });
  const { count, data } = await res.json();
  const posts = data.map(mapResponseToPost);
  return {
    count,
    posts,
  };
};


export const createPost = async (
  text: string,
  image: File | undefined,
  token: string | undefined
): Promise<Post> => {
  const formData = new FormData();
  formData.append('text', text);
  if (image) {
    formData.append('image', image);
  }

  const headers = new Headers();
  headers.append('Authorization', `Bearer ${token}`);

  const url = `${process.env.NEXT_PUBLIC_QWACKER_API_URL}/posts?`;
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    headers,
  });
  const response: Response = await res.json();
  return mapResponseToPost(response);
};

export const getPostById = async (id: string): Promise<Post> => {
  const url = `${process.env.NEXT_PUBLIC_QWACKER_API_URL}/posts/${id}`;
  const res = await fetch(url);
  const post: Response = await res.json();
  return mapResponseToPost(post);
};


export const getPostsByUser = async (creator: string): Promise<GetPostResponse> => {
  const url = `${process.env.NEXT_PUBLIC_QWACKER_API_URL}/posts?creator=${creator}`;
  const res = await fetch(url);
  const { count, data } = await res.json();
  const posts = data.map(mapResponseToPost);
  return {
    count,
    posts,
  };
};
