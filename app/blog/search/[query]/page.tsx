import CONFIG from "@/app/lib/config";
import { searchPosts } from "../../[slug]/actions";
import BlogList from "../../components/blog-list";
import getMetadata from "@/app/lib/metadata";

export async function generateMetadata({ params }: { params: { query: string } }) {
    return getMetadata({
        title: `Search results for "${params.query}"`,
        info: (new Date()).toLocaleDateString(),
        description: `Search results for "${params.query}"`,
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