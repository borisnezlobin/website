// this is a whole shebang of a component that will render a tweet embed
// basically, using the actual Twitter embed script is a pain in the
// because it loads several MB of JS to keep their data proprietary n stuff
// so, we use some thingy I found: https://react-tweet-next.vercel.app/light/1817015526071439755

import { Tweet } from "react-tweet";

const TwitterEmbed = ({ tweetId }: { tweetId: string }) => {
    return (
        <div className="twitter-embed">
            <Tweet id={tweetId} />
        </div>
    );
}

export default TwitterEmbed;