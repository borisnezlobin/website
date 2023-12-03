import NotFoundPage from "./components/not-found-page";

export async function generateMetadata() {
    return {
        title: '404 / Boris Nezlobin',
        description: 'This page could\'t be found.\nVisit my website to contact me, see what I\'m up to, and learn more about me!',
    }
}

const NotFound = () => {
    return (
        <NotFoundPage />
    );
}

export default NotFound;