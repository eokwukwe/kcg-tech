import { type Session } from "@acme/auth";
import type { NextPage } from "next";
import { signIn, signOut } from "next-auth/react";
import Head from "next/head";
import { useState } from "react";

import { api, type RouterOutputs } from "~/utils/api";

const PostCard: React.FC<{
  post: RouterOutputs["post"]["all"][number];
  onPostDelete?: () => void;
  onPostLike?: () => void;
  session: Session | undefined | null;
}> = ({ post, session, onPostLike, onPostDelete }) => {
  const liked =
    post.likes.findIndex((like) => like.userId === session?.user.id) !== -1;

  return (
    <div className="flex flex-row rounded-lg bg-white/10 p-4 transition-all hover:scale-[101%]">
      <div className="flex-grow">
        <h2 className="text-2xl font-bold text-pink-400">{post.title}</h2>
        <p className="mt-2 text-sm">{post.content}</p>
      </div>
      <div>
        {
          <>
            <button
              type="button"
              className={`mr-4 flex items-center justify-center rounded px-1.5 py-1 text-xs font-bold disabled:cursor-not-allowed disabled:bg-opacity-70 ${
                liked
                  ? "bg-red-400 bg-opacity-95 text-red-900"
                  : "bg-green-400 bg-opacity-95 text-green-900 "
              }`}
              onClick={onPostLike}
              disabled={!session || liked}
            >
              {liked ? "Liked" : "Like"} ({post._count.likes})
            </button>

            <button
              type="button"
              className="text-sm font-bold uppercase text-pink-400"
              onClick={onPostDelete}
            >
              Delete
            </button>
          </>
        }
      </div>
    </div>
  );
};

const CreatePostForm: React.FC = () => {
  const utils = api.useContext();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { mutate, error } = api.post.create.useMutation({
    async onSuccess() {
      setTitle("");
      setContent("");
      await utils.post.all.invalidate();
    },
  });

  return (
    <div className="flex w-full max-w-2xl flex-col p-4">
      <input
        className="mb-2 rounded bg-white/10 p-2 text-white"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
      />
      {error?.data?.zodError?.fieldErrors.title && (
        <span className="mb-2 text-red-500">
          {error.data.zodError.fieldErrors.title}
        </span>
      )}
      <input
        className="mb-2 rounded bg-white/10 p-2 text-white"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Content"
      />
      {error?.data?.zodError?.fieldErrors.content && (
        <span className="mb-2 text-red-500">
          {error.data.zodError.fieldErrors.content}
        </span>
      )}
      <button
        className="rounded bg-pink-400 p-2 font-bold"
        onClick={() => {
          mutate({
            title,
            content,
          });
        }}
      >
        Create
      </button>
    </div>
  );
};

const Home: NextPage = () => {
  const { data: session } = api.auth.getSession.useQuery();
  const postQuery = api.post.all.useQuery();

  const deletePostMutation = api.post.delete.useMutation({
    onSettled: () => postQuery.refetch(),
  });

  const likePostMutation = api.post.like.useMutation({
    onSettled: () => postQuery.refetch(),
  });

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container mt-12 flex flex-col items-center justify-center gap-4 px-4 py-8">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Create <span className="text-pink-400">T3</span> Turbo
          </h1>
          <AuthShowcase />

          <CreatePostForm />

          {postQuery.data ? (
            <div className="w-full max-w-2xl">
              {postQuery.data?.length === 0 ? (
                <span>There are no posts!</span>
              ) : (
                <div className="flex h-[40vh] justify-center overflow-y-scroll px-4 text-2xl">
                  <div className="flex w-full flex-col gap-4">
                    {postQuery.data?.map((p) => {
                      return (
                        <PostCard
                          key={p.id}
                          post={p}
                          onPostDelete={() => deletePostMutation.mutate(p.id)}
                          onPostLike={() => likePostMutation.mutate(p.id)}
                          session={session}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </main>
    </>
  );
};

export default Home;

const AuthShowcase: React.FC = () => {
  const { data: session } = api.auth.getSession.useQuery();
  const postsCount = api.post.count.useQuery();

  // const { data: secretMessage } = api.auth.getSecretMessage.useQuery(
  //   undefined, // no input
  //   { enabled: !!session?.user },
  // );

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {session?.user && (
        <p className="text-center text-2xl text-white">
          {session && (
            <span>
              Logged in as{" "}
              <span className="font-semibold uppercase text-pink-400">
                {session?.user?.name}
              </span>
            </span>
          )}
        </p>
      )}
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={session ? () => void signOut() : () => void signIn()}
      >
        {session ? "Sign out" : "Sign in"}
      </button>

      <div>
        Total posts:{" "}
        {!session ? <span>N/A</span> : <span>{postsCount.data}</span>}
      </div>
    </div>
  );
};
