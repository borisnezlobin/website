import CONFIG from "@/app/lib/config";
import { searchPosts } from "../../[slug]/actions";
import BlogList from "../../components/blog-list";
import getMetadata from "@/app/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ query: string }> }) {
    const { query } = await params;
    return getMetadata({
        title: `Search results for "${query.slice(0, 20)}"`,
        info: (new Date()).toLocaleDateString(),
        subtitle: "Boris Nezlobin.",
        description: `Search results for "${query}" on Boris Nezlobin's blog.`,
    });
}

const SearchResultsPage = async ({ params }: { params: Promise<{ query: string }> }) => {
    const { query } = await params;

    const posts = await searchPosts(query);

    return (
        <BlogList
            articles={posts}
            title={`Search "${query}"`}
            query={query}
        />
    );
};

export default SearchResultsPage;