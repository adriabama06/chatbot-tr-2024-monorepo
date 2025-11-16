export async function get_posts(page = 1, per_page = 20) {
    const response = await fetch(
        `https://HIDDEN/wp-json/wp/v2/posts?page=${page}&per_page=${per_page}`
    );

    const json = await response.json();

    return json;
}

export async function get_pages(page = 1, per_page = 20) {
    const response = await fetch(
        `https://HIDDEN/wp-json/wp/v2/pages?page=${page}&per_page=${per_page}`
    );

    const json = await response.json();

    return json;
}