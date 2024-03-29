import {
  Post,
  PostComment,
} from '@smartive-education/design-system-component-z-index';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from 'next';
import { unstable_getServerSession } from 'next-auth';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useEffect, useReducer, useState } from 'react';
import { useRouter } from 'next/router';
import {
  GetPostDetailsResponse,
  MumbleType,
  MumbleUser,
  Reply,
} from '../../models';
import { mapReplyToReplyWithUserData } from '../../models/mappers';
import { postDetailReducer } from '../../reducers/post-detail.reducers';
import { like } from '../../services/like.service';
import { getPostDetailsWithUserData } from '../../services/mumble.service';
import { createReply } from '../../services/reply.service';
import { authOptions } from '../api/auth/[...nextauth]';

export default function PostDetailPage({
  post,
  replies,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [state, dispatch] = useReducer(postDetailReducer, {
    post,
    replies,
  });
  const [host, setHost] = useState('');
  useEffect(() => {
    setHost(() => window.location.origin);
  }, []);

  const submitReply = async (
    image: File | undefined,
    form: HTMLFormElement
  ) => {
    if (session) {
      const createdReply: Reply = await createReply(
        (form.elements.namedItem('post-comment') as HTMLInputElement).value,
        image,
        session?.accessToken,
        post.id
      );
      const loggedInUser: Partial<MumbleUser> = {
        firstName: session.firstName,
        lastName: session.lastName,
        userName: session.userName,
        avatarUrl: session.avatarUrl,
      };
      dispatch({
        type: 'CREATE',
        reply: mapReplyToReplyWithUserData(
          createdReply,
          loggedInUser as MumbleUser
        ),
      });
    }
  };

  const likeMumble = async (isLiked: boolean, id: string, type: MumbleType) => {
    await like(id, isLiked, session?.accessToken);
    if (type === 'post') {
      dispatch({ type: 'LIKE-POST', id, isLiked });
    } else {
      dispatch({ type: 'LIKE-REPLY', id, isLiked });
    }
  };


  return (
    <>
      <Post
        profileHeaderType='POST'
        name={state.post.fullName}
        userName={state.post.userName}
        postCreationTime={state.post.createdTimestamp}
        src={state.post.avatarUrl}
        content={state.post.text}
        commentCount={state.post.replyCount}
        isLiked={state.post.likedByUser}
        likeCount={state.post.likeCount}
        link={`${host}/post/${state.post.id}`}
        comment={() => {}}
        openProfile={() => router.push(`/profile/${state.post.creator}`)}
        setIsLiked={(isLiked) =>
          likeMumble(isLiked, state.post.id, state.post.type)
        }
        copyLabel='Copy Link'
        copiedLabel='Link Copied'
      >
        {state.post.mediaUrl && (
          <Image
            src={state.post.mediaUrl}
            alt={state.post.text}
            fill
            sizes='(min-width: 60rem) 40vw,
                          (min-width: 30rem) 50vw,
                          100vw'
          />
        )}
      </Post>
      {status === 'authenticated' && (
        <PostComment
          profileHeaderType='CREATE-REPLY'
          name={session.fullName}
          userName={session.userName}
          src={session.avatarUrl}
          postCreationTime=''
          placeholder='Was meinst du dazu?'
          LLabel='Bild hochladen'
          RLabel='Absenden'
          openProfile={() => {}}
          onSubmit={(file, form) => submitReply(file, form)}
        ></PostComment>
      )}
      {state.replies.map((reply) => {
        if (reply.type === 'reply') {
          return (
            <Post
              profileHeaderType='REPLY'
              key={reply.id}
              name={reply.fullName}
              userName={reply.userName}
              postCreationTime={reply.createdTimestamp}
              src={reply.avatarUrl}
              content={reply.text}
              commentCount={0} // TODO make this optional for replies
              isLiked={reply.likedByUser}
              likeCount={reply.likeCount}
              link={`${host}/post/${reply.id}`}
              comment={() => {}}
              openProfile={() => router.push(`/profile/${reply.creator}`)}
              setIsLiked={(isLiked) =>
                likeMumble(isLiked, reply.id, reply.type)
              }
              copyLabel='Copy Link'
              copiedLabel='Link Copied'
            >
              {reply.mediaUrl && (
                <Image
                  src={reply.mediaUrl}
                  alt={reply.text}
                  fill
                  sizes='(min-width: 60rem) 40vw,
                        (min-width: 30rem) 50vw,
                        100vw'
                />
              )}
            </Post>
          );
        } else {
          return '';
        }
      })}
    </>
  );
}

export const getServerSideProps: GetServerSideProps<
  GetPostDetailsResponse
> = async (context: GetServerSidePropsContext) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  );

  if (!session?.accessToken) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  const { post, replies } = await getPostDetailsWithUserData(
    session?.accessToken,
    context.query.id as string
  );
  return {
    props: {
      post,
      replies,
    },
  };
};
