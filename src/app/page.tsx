"use client";

import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const POSTS_ENDPOINT = "/api/posts";

type WordPressPost = {
  id: number;
  link: string;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  date: string;
  _embedded?: {
    ["wp:featuredmedia"]?: Array<{
      source_url?: string;
      alt_text?: string;
    }>;
  };
};

type FetchError = Error & {
  status?: number;
};

const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const error: FetchError = new Error("Failed to load WordPress posts.");
    error.status = response.status;
    throw error;
  }

  return (await response.json()) as WordPressPost[];
};

const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, "");

const getFeaturedImage = (post: WordPressPost) => {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];

  if (!media?.source_url) {
    return null;
  }

  return {
    src: media.source_url,
    alt: media.alt_text || stripHtml(post.title.rendered),
  };
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

const PostSkeleton = () => (
  <div className="animate-pulse space-y-6 rounded-xl border border-dashed p-6">
    <div className="aspect-[4/3] w-full rounded-lg bg-muted" />
    <div className="space-y-3">
      <div className="h-4 w-3/4 rounded bg-muted" />
      <div className="h-3 w-full rounded bg-muted" />
      <div className="h-3 w-5/6 rounded bg-muted" />
    </div>
    <div className="h-3 w-24 rounded bg-muted" />
  </div>
);

export default function Home() {
  const { data, error, isLoading, isValidating } = useSWR<WordPressPost[]>(
    POSTS_ENDPOINT,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 120000,
    },
  );

  const isRefreshing = Boolean(!isLoading && isValidating);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            WordPress News Explorer
          </h1>
          <p className="text-muted-foreground max-w-2xl self-center text-base">
            Browse the latest posts straight from the official WordPress news
            feed. Tap any card to read the full story on wordpress.org.
          </p>
          {isRefreshing ? (
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Updating feed…
            </span>
          ) : null}
        </header>

        {error ? (
          <section className="flex flex-col items-center justify-center rounded-xl border border-destructive/40 bg-destructive/5 p-10 text-center">
            <h2 className="text-xl font-semibold text-destructive">
              Could not load the WordPress feed.
            </h2>
            <p className="text-muted-foreground mt-2 max-w-lg text-sm">
              Please refresh the page or try again later.
            </p>
          </section>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {isLoading
              ? Array.from({ length: 12 }, (_, index) => (
                  <PostSkeleton key={`skeleton-${index}`} />
                ))
              : data?.map((post) => {
                  const image = getFeaturedImage(post);

                  return (
                    <Card
                      key={post.id}
                      className="transition hover:shadow-md focus-within:shadow-md"
                    >
                      <div className="aspect-[4/3] w-full px-6 pt-6">
                        {image ? (
                          <div className="relative h-full w-full overflow-hidden rounded-lg">
                            <Image
                              src={image.src}
                              alt={image.alt}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              className="rounded-lg object-cover"
                              priority={false}
                            />
                          </div>
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 px-4 text-center">
                            <span className="text-sm font-medium text-muted-foreground">
                              No image available
                            </span>
                            <span className="text-xs text-muted-foreground/80">
                              This WordPress post ships without a featured image.
                            </span>
                          </div>
                        )}
                      </div>

                      <CardHeader className="gap-3">
                        <CardTitle className="text-lg">
                          {stripHtml(post.title.rendered)}
                        </CardTitle>
                        <CardDescription className="line-clamp-3 text-sm">
                          {stripHtml(post.excerpt.rendered)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                          Published {formatDate(post.date)}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Link
                          href={post.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          Read full post →
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
          </section>
        )}
      </main>
    </div>
  );
}
