import { Element, type HTMLReactParserOptions, attributesToProps, domToReact } from 'html-react-parser';
import type { DOMNode } from 'html-react-parser';

// html-react-parser options that inject loading="lazy" on <img> elements and
// preload="none" on <video> elements found in WordPress post content.
const parseLazyMedia: HTMLReactParserOptions = {
  replace(domNode: DOMNode) {
    if (!(domNode instanceof Element)) {
      return;
    }
    if (domNode.name === 'img') {
      return <img {...attributesToProps(domNode.attribs)} loading="lazy" />;
    }
    if (domNode.name === 'video') {
      return (
        <video {...attributesToProps(domNode.attribs)} preload="none">
          {domToReact(domNode.children as DOMNode[], parseLazyMedia)}
        </video>
      );
    }
  },
};

export default parseLazyMedia;
