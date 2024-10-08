import CONFIG from "@/app/lib/config";
import { searchPosts } from "../../[slug]/actions";
import BlogList from "../../components/blog-list";
import getMetadata from "@/app/lib/metadata";

export async function generateMetadata({ params }: { params: { query: string } }) {
    return getMetadata({
        title: `Search results for "${params.query.slice(0, 20)}"`,
        info: (new Date()).toLocaleDateString(),
        subtitle: "Boris Nezlobin.",
        description: `Search results for "${params.query}" on Boris Nezlobin's blog.`,
    });
}

const SearchResultsPage = async ({ params }: { params: { query: string } }) => {
    params.query = decodeURIComponent(params.query);

    const posts = await searchPosts(params.query);

    return (
        <BlogList
            articles={posts}
            title={`Search "${params.query}"`}
            query={params.query}
        />
    );
};

export default SearchResultsPage;