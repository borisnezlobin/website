import { Article } from "@prisma/client";

const EmptyPost: Article = {
    id: "abc123xyz",
    slug: "",
    title: "",
    description: "",
    body: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    image: "",
    likes: 0,
};

export default EmptyPost;