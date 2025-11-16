import Markdown from "react-markdown";
import remarkGfm  from "remark-gfm";

// https://stackoverflow.com/questions/69119798/react-markdown-links-dont-open-in-a-new-tab-despite-using-target-blank
function LinkRenderer(props) {
    return (
        <a href={props.href} target="_blank" rel="noreferrer">
            {props.children}
        </a>
    )
}

export default function Message(props) {
    const { content, role } = props;

    return (
        <>
            <div className={`message ${role}`}>
                <Markdown components={{ a: LinkRenderer }} remarkPlugins={[remarkGfm]}>{content}</Markdown>
            </div>
        </>
    )
}