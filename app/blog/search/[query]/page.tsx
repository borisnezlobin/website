import { searchPosts } from "../../[slug]/actions";
import BlogList from "../../components/blog-list";
import BlogPage from "../../page";
import SearchPage from "../page";

export async function generateMetadata({ params }: { params: { query: string } }) {
    return {
        title: `Search results for "${params.query}" / Boris Nezlobin`,
        description: `Search results for "${params.query}"`,
    }
}

const SearchResultsPage = async ({ params }: { params: { query: string } }) => {
    params.query = decodeURIComponent(params.query);

    // probably not needed, idk
    // if(params.query.trim().length === 0){
    //     return <SearchPage />;
    // }

    const posts = await searchPosts(params.query);

    return (
        <BlogList
            articles={posts}
            title={`Blog / Search "${params.query}"`}
            query={params.query}
        />
    );
};

export default SearchResultsPage;