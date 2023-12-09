import CONFIG from "@/app/lib/config";
import { searchPosts } from "../../[slug]/actions";
import BlogList from "../../components/blog-list";
import getMetadata from "@/app/lib/metadata";

export async function generateMetadata({ params }: { params: { query: string } }) {
    const ogUrl = CONFIG.API_URL + '/og?title=Search%20results%20for%20%22' + encodeURIComponent(params.query.slice(0, 20)) + '%22&subtitle=Search Blog';
    console.log("getting og image from " + ogUrl);
    return getMetadata({
        title: `Search results for "${params.query}" abc / Boris Nezlobin`,
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
            title={`Blog / Search "${params.query}"`}
            query={params.query}
        />
    );
};

export default SearchResultsPage;