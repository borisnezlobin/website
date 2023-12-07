import { searchPosts } from "../../[slug]/actions";
import BlogPage from "../../page";

export async function generateMetadata({ params }: { params: { query: string } }) {
    return {
        title: `Search results for "${params.query}" / Boris Nezlobin`,
        description: `Search results for "${params.query}"`,
    }
}

const SearchResultsPage = async ({ params }: { params: { query: string } }) => {
    params.query = decodeURIComponent(params.query);
    if(params.query.trim().length === 0){
        return <BlogPage title="Blog / Search" />
    }

    const posts = await searchPosts(params.query);

    return (
        <BlogPage
            articles={posts}
            title={`Blog / Search "${params.query}"`}
            query={params.query}
        />
    );
};

export default SearchResultsPage;