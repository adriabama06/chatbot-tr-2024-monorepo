/**
 * @param {string} html 
 * @returns {string}
*/
export function remove_html_tags(html) {
    var result = "";

    for(var i = 0; i < html.length; i++) {
        const charecter = html[i];
    
        if(charecter == "<") { 
            i = html.indexOf(">", i + 1);

            if(i < 0) break;

            continue;
        }
    
        result += charecter;
    }

    return result;
}

export function remove_html_br_tag(html) {
    var result = "";

    for(var i = 0; i < html.length; i++) {
        const charecter = html[i];
    
        if(charecter == "<") {
            if(html[i + 1] + html[i + 2] == "br") {
                i = html.indexOf(">", i + 1);

                if(i < 0) break;

                continue;
            }
        }
    
        result += charecter;
    }

    return result;
}

const REPLACE_WORDS = {
    "&#8217;": "'",
    "&#8220;": "\"",
    "&#8221;": "\"",
    "&#8211": "-",
    "&#8230": "...",
    "&#038": "&",
    "&#8242": "'",
    "&#215": "x",
    "&#8216": "'",
    "&#8243": "\"",
    "&gt": ">",
    "&nbsp": "",
    "\u2019": "'",
    "\u00A0": " ",
    "\u003C": "<",
    "\u003E": ">",
    "\u2013": "-",
    "\ufeff": "",
    "\u202f": "",
    "\u2018": "`",
    "\u200b": "",
    ";": "",
    "•": "·"
};

// https://mel-meng-pe.medium.com/quickly-identify-and-remove-illegal-characters-in-your-large-text-files-cd4f03b00a43
// https://www.soscisurvey.de/tools/view-chars.php


/**
 * @param {string} word 
 * @returns {string}
 */
export function word_to_regex(word) {
    if(word.startsWith("&")) return word;

    var new_word = "";

    for (const charecter of word) {
        new_word += `\\${charecter}`;
    }

    return new_word;
}

/**
 * @param {string} text 
 * @returns {string}
 */
export function correct_words(text) {
    for(const key in REPLACE_WORDS) {
        text = text.replace(new RegExp(word_to_regex(key), "g"), REPLACE_WORDS[key]);
    }

    return text;
}

/**
 * @param {string} html 
 * @returns {string[]}
 */
export function extract_links(html) {
    var links = [];

    for(
        var posibleLink = html.indexOf("http");
        posibleLink > 0;
        posibleLink = html.indexOf("http", posibleLink + 1)
    ) {
        // Extract link

        var link = html.slice(
            posibleLink,
            html.indexOf("\"", posibleLink)
        );

        link = remove_html_tags(link);

        link = link.trim().split(" ")[0].split("\n")[0].trim();

        if(links.includes(link)) continue;

        // Usially images are repeated with diferent resolutions,
        // extract a small name of the file and check if is in the list
        // to prevent repeat links

        var unique_name = link.split("/");

        unique_name = unique_name[unique_name.length - 1];

        unique_name = unique_name.replace(/\_/g, '-').split("-")[2];

        if(unique_name && links.find(l => l.includes(unique_name))) continue;


        // if all ok, add to the list the link
        links.push(link);
    }

    return links;
}

/**
 * @param {string} raw_text 
 */
export function parse_post_data(raw_text) {
    const text = remove_html_tags(
        correct_words(raw_text)
    );

    const fixed_text = correct_words(text).trim()
        .replace(/(\r\n|\n|\r)/gm, ' ')
        .replace(/\t+/gm, ' ')
        .replace(/ +/g, ' ')
        .trim();
    
    const links = extract_links(raw_text);

    return { text: fixed_text, links };
}
