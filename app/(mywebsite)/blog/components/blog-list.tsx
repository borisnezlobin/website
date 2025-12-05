"use client";

import { Article } from "@prisma/client";
import { SearchBar } from "../[slug]/search-bar";
import Link from "next/link";
import BlogListItem from "./blog-list-item";
import RandomQuote from "./random-quote";
import { useState } from "react";
import Age from "@/app/components/landing/age";

const BlogList = ({
    articles,
    title,
    query = "",
}: {
    articles: Article[];
    title?: string;
    query?: string;
}) => {
    const [showPersonalArticles, setShowPersonalArticles] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    return (
        <div
            className="pagepad"
            suppressHydrationWarning
        >
            {title ?
                <h1 className={`text-3xl mt-8 mb-4`}>{title}</h1>
            : (
                <h1 className={`text-3xl mt-8 mb-6 font-normal`}>
                    My&nbsp;
                    <span className="text-5xl vectra">Writing.</span>
                </h1>
            )}
            <RandomQuote />
            {/* <SearchBar query={query}>
                <p className="text-muted dark:text-muted-dark print:mb-4">
                {query && (
                    <>
                    <Link
                        href="/blog"
                        className="link font-semibold"
                        title="Clear search"
                    >
                        Clear search
                    </Link>
                    <span className="text-muted dark:text-muted-dark">{" • "}</span>
                    </>
                )}
                Showing {articles.length} article{articles.length == 1 ? " " : "s "}
                </p>
            </SearchBar> */}
            <div className="mb-4 w-full flex justify-start print:hidden">
                <label className="inline-flex items-center cursor-pointer group">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only hidden"
                            checked={showPersonalArticles}
                            onChange={() => {
                                if (!showPersonalArticles) {
                                    setShowConfirmDialog(true);
                                } else {
                                    setShowPersonalArticles(false);
                                }
                            }}
                        />
                        <div className={`w-5 h-5 border-2 rounded transition-all duration-200 ${
                            showPersonalArticles 
                                ? 'bg-primary dark:bg-primary-dark border-primary dark:border-primary-dark' 
                                : 'border-muted dark:border-muted-dark group-hover:border-primary dark:group-hover:border-primary-dark'
                        }`}>
                            {showPersonalArticles && (
                                <svg className="w-3 h-3 text-white dark:text-dark-background m-0.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                    </div>
                    <span className="ml-3 text-light dark:text-dark group-hover:text-primary dark:group-hover:text-primary-dark transition-colors duration-200">
                        Show personal articles
                    </span>
                </label>
                
                {showConfirmDialog && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-light-background dark:bg-dark-background border border-muted dark:border-muted-dark rounded-lg p-6 max-w-md w-full shadow-lg">
                            <h3 className="text-lg font-semibold mb-3">
                                Are you <i>sure</i> about that?
                            </h3>
                            <p className="text-muted dark:text-muted-dark mb-4 leading-relaxed">
                                <i>Really</i> sure? Keep in mind that my personal articles are <b>word barf that landed on the page in paragraphs</b> (all of which are informal, unrevised, full of typos. and et cetera.).<br /><br />
                                Like, they&apos;re long-form Tweets. By me, a <Age />-year-old. They are here for fun and are <b>not meant to impress anyone</b>.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowConfirmDialog(false)}
                                    className="px-4 py-2 text-muted dark:text-muted-dark hover:text-light dark:hover:text-dark transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPersonalArticles(true);
                                        setShowConfirmDialog(false);
                                    }}
                                    className="px-4 py-2 bg-primary dark:bg-primary-dark text-white rounded hover:opacity-90 transition-opacity duration-200"
                                >
                                    I don&apos;t value my sanity.
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {articles.map((post) => {
                if (post.slug.startsWith("draft-")) return null;
                const isPersonal = post.slug.startsWith("personal-");
                if (isPersonal && !showPersonalArticles) return null;
                return (
                    <BlogListItem post={post} inGrid={false} key={post.id} />
                );
            })}
        </div>
    );
};

export default BlogList;
