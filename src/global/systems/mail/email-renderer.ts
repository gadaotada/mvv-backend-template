import { createElement } from 'react';
import { render } from '@react-email/components';

export class EmailRenderer {
    static async renderTemplate(
        Template: React.FC,
        props: any
    ): Promise<string> {
        const template = createElement(Template, props);
        return await render(template);
    }
} 