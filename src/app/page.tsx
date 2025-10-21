"use client";

import { useEffect, useState } from "react";

import {
  DndContext,
  PointerSensor,
  closestCorners,
  type DragEndEvent,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const POSTS_ENDPOINT = "/api/posts";
const COLUMN_COUNT = 4;

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

type PostColumn = {
  id: string;
  label: string;
  posts: WordPressPost[];
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

const createEmptyColumns = (): PostColumn[] =>
  Array.from({ length: COLUMN_COUNT }, (_, index) => ({
    id: `column-${index}`,
    label: `Column ${index + 1}`,
    posts: [],
  }));

const getPostId = (post: WordPressPost) => post.id.toString();

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

type SortablePostCardProps = {
  post: WordPressPost;
};

const SortablePostCard = ({ post }: SortablePostCardProps) => {
  const image = getFeaturedImage(post);
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: getPostId(post) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-none",
        isDragging ? "z-10 cursor-grabbing opacity-80" : "cursor-grab",
      )}
      {...attributes}
      {...listeners}
    >
      <Card
        className={cn(
          "transition hover:shadow-md focus-within:shadow-md",
          isDragging && "shadow-lg",
        )}
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
    </div>
  );
};

const ColumnEmptyState = () => (
  <div className="flex min-h-[120px] flex-1 items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 px-4 text-center text-sm text-muted-foreground">
    Drop posts here
  </div>
);

type ColumnProps = {
  column: PostColumn;
};

const Column = ({ column }: ColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {column.label}
      </h3>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[220px] flex-col gap-6 rounded-xl border border-transparent p-1 transition",
          isOver && "border-primary/40 bg-primary/5",
        )}
      >
        <SortableContext
          items={column.posts.map((post) => getPostId(post))}
          strategy={verticalListSortingStrategy}
        >
          {column.posts.length > 0 ? (
            column.posts.map((post) => (
              <SortablePostCard key={post.id} post={post} />
            ))
          ) : (
            <ColumnEmptyState />
          )}
        </SortableContext>
      </div>
    </div>
  );
};

export default function Home() {
  const { data, error, isLoading, isValidating } = useSWR<WordPressPost[]>(
    POSTS_ENDPOINT,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 120000,
    },
  );

  const [columns, setColumns] = useState<PostColumn[]>(() =>
    createEmptyColumns(),
  );

  useEffect(() => {
    if (!data) {
      return;
    }

    setColumns((prevColumns) => {
      const incomingIds = new Set(data.map((post) => getPostId(post)));
      const filtered = prevColumns.map((column) => ({
        ...column,
        posts: column.posts.filter((post) =>
          incomingIds.has(getPostId(post)),
        ),
      }));

      const existingIds = new Set(
        filtered.flatMap((column) =>
          column.posts.map((post) => getPostId(post)),
        ),
      );

      const newPosts = data.filter(
        (post) => !existingIds.has(getPostId(post)),
      );

      if (newPosts.length === 0) {
        return filtered;
      }

      const nextColumns = filtered.map((column) => ({
        ...column,
        posts: [...column.posts],
      }));

      newPosts.forEach((post) => {
        const targetIndex = nextColumns.reduce((minIndex, column, idx) => {
          if (column.posts.length < nextColumns[minIndex].posts.length) {
            return idx;
          }
          return minIndex;
        }, 0);

        nextColumns[targetIndex].posts.push(post);
      });

      return nextColumns;
    });
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const isRefreshing = Boolean(!isLoading && isValidating);
  const hasPosts = columns.some((column) => column.posts.length > 0);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    setColumns((prevColumns) => {
      const sourceColumnIndex = prevColumns.findIndex((column) =>
        column.posts.some((post) => getPostId(post) === activeId),
      );

      if (sourceColumnIndex === -1) {
        return prevColumns;
      }

      const targetColumnIndex = prevColumns.findIndex((column) => {
        if (column.id === overId) {
          return true;
        }

        return column.posts.some(
          (post) => getPostId(post) === overId,
        );
      });

      if (targetColumnIndex === -1) {
        return prevColumns;
      }

      if (
        sourceColumnIndex === targetColumnIndex &&
        overId === activeId
      ) {
        return prevColumns;
      }

      const updatedColumns = prevColumns.map((column) => ({
        ...column,
        posts: [...column.posts],
      }));

      const sourcePosts = updatedColumns[sourceColumnIndex].posts;
      const targetPosts = updatedColumns[targetColumnIndex].posts;
      const movingIndex = sourcePosts.findIndex(
        (post) => getPostId(post) === activeId,
      );

      if (movingIndex === -1) {
        return prevColumns;
      }

      const [movingPost] = sourcePosts.splice(movingIndex, 1);

      if (!movingPost) {
        return prevColumns;
      }

      if (sourceColumnIndex === targetColumnIndex) {
        const targetPostIndex = targetPosts.findIndex(
          (post) => getPostId(post) === overId,
        );

        const insertIndex =
          targetPostIndex >= 0 ? targetPostIndex : targetPosts.length;

        targetPosts.splice(insertIndex, 0, movingPost);
        return updatedColumns;
      }

      if (updatedColumns[targetColumnIndex].id === overId) {
        targetPosts.push(movingPost);
        return updatedColumns;
      }

      const targetPostIndex = targetPosts.findIndex(
        (post) => getPostId(post) === overId,
      );

      const insertIndex =
        targetPostIndex >= 0 ? targetPostIndex : targetPosts.length;

      targetPosts.splice(insertIndex, 0, movingPost);

      return updatedColumns;
    });
  };

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
        ) : isLoading ? (
          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 12 }, (_, index) => (
              <PostSkeleton key={`skeleton-${index}`} />
            ))}
          </section>
        ) : hasPosts ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
          >
            <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {columns.map((column) => (
                <Column key={column.id} column={column} />
              ))}
            </section>
          </DndContext>
        ) : (
          <section className="grid place-items-center rounded-xl border border-dashed p-10 text-center">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">
                No posts are available right now.
              </h2>
              <p className="text-muted-foreground text-sm">
                Try refreshing the page to fetch the latest WordPress news.
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
