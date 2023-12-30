import db from "@/app/lib/db";

export const seedTags = async () => {
    console.log("Deleting all tags...");
    await db.tag.deleteMany();
    console.log("Seeding tags...");
    await db.tag.create({
        data: {
            name: "NextJS",
            slug: "nextjs",
            image: "https://tech.sparkfabrik.com/images/content/nextjs/nextjs-logo.jpg"
        }
    });
    await db.tag.create({
        data: {
            name: "JavaScript",
            slug: "js",
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/JavaScript-logo.png/640px-JavaScript-logo.png"
        }
    });
    await db.tag.create({
        data: {
            name: "SQL",
            slug: "sql",
            image: "https://upload.wikimedia.org/wikipedia/commons/8/87/Sql_data_base_with_logo.png"
        }
    });
    await db.tag.create({
        data: {
            name: "React",
            slug: "react",
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/640px-React-icon.svg.png"
        }
    });
    await db.tag.create({
        data: {
            name: "Electron",
            slug: "electron",
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Electron_Software_Framework_Logo.svg/640px-Electron_Software_Framework_Logo.svg.png"
        }
    });
    await db.tag.create({
        data: {
            name: "In Progress",
            slug: "in-progress",
            image: "https://media.istockphoto.com/id/508408464/vector/work-in-progress-loading-bar.jpg?s=612x612&w=0&k=20&c=NyDSPinMdT1wuEODQQPk2YS2Tt-qf3K-w620zK3F9ls="
        }
    })
    await db.tag.create({
        data: {
            name: "TypeScript",
            slug: "ts",
            image: "https://cdn-images-1.medium.com/max/2000/1*mn6bOs7s6Qbao15PMNRyOA.png"
        }
    });
    console.log("Done seeding tags.");
}