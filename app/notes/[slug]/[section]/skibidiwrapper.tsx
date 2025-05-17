"use client";
import "../../../styles/mjx.css"

const Wrapper = ({ content }: { content: string }) => {
    return (
        <div>
            <div
            className="markdown-preview-view markdown-rendered allow-fold-headings allow-fold-lists is-readable-line-width"
            >
            <div className="markdown-preview-sizer markdown-preview-section">
                <div dangerouslySetInnerHTML={{ __html: content}} />
            </div>
            </div>
      </div>
    )
}

export { Wrapper };