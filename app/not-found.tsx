import { Metadata } from "next";
import NotFoundPage from "./components/not-found-page";
import getMetadata from "./lib/metadata";

export const metadata: Metadata = getMetadata({
  title: "404",
  description: "Page not found",
});

const NotFound = () => {
  return <NotFoundPage />;
};

export default NotFound;
