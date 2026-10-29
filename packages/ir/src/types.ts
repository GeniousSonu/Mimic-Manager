import { z } from 'zod';

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export interface ViewportDimensions {
  desktop: { width: 1440; height: 900 };
  tablet: { width: 820; height: 1180 };
  mobile: { width: 390; height: 844 };
}

export type IRNodeType = 
  | 'container'
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'button'
  | 'list'
  | 'columns'
  | 'column'
  | 'custom';

export interface StyleProperties {
  display?: 'flex' | 'grid' | 'block' | 'inline-block';
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'space-between' | 'flex-end';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  gap?: string;
  padding?: string;
  margin?: string;
  width?: string;
  maxWidth?: string;
  height?: string;
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  borderRadius?: string;
  border?: string;
}

export interface IRNode {
  id: string;
  type: IRNodeType;
  tag?: string;
  text?: string;
  attributes?: Record<string, string>;
  styles: {
    desktop: StyleProperties;
    tablet?: Partial<StyleProperties>;
    mobile?: Partial<StyleProperties>;
  };
  children?: IRNode[];
}

export interface IRDocument {
  version: '1.0';
  title?: string;
  sourceUrl?: string;
  capturedAt: string;
  viewports: ViewportMode[];
  root: IRNode;
}

export const IRStylePropertiesSchema = z.object({
  display: z.enum(['flex', 'grid', 'block', 'inline-block']).optional(),
  flexDirection: z.enum(['row', 'column']).optional(),
  justifyContent: z.enum(['flex-start', 'center', 'space-between', 'flex-end']).optional(),
  alignItems: z.enum(['flex-start', 'center', 'flex-end', 'stretch']).optional(),
  gap: z.string().optional(),
  padding: z.string().optional(),
  margin: z.string().optional(),
  width: z.string().optional(),
  maxWidth: z.string().optional(),
  height: z.string().optional(),
  backgroundColor: z.string().optional(),
  color: z.string().optional(),
  fontSize: z.string().optional(),
  fontWeight: z.string().optional(),
  lineHeight: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  borderRadius: z.string().optional(),
  border: z.string().optional(),
});

export const IRNodeSchema: z.ZodType<IRNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.enum([
      'container',
      'heading',
      'paragraph',
      'image',
      'button',
      'list',
      'columns',
      'column',
      'custom',
    ]),
    tag: z.string().optional(),
    text: z.string().optional(),
    attributes: z.record(z.string()).optional(),
    styles: z.object({
      desktop: IRStylePropertiesSchema,
      tablet: IRStylePropertiesSchema.partial().optional(),
      mobile: IRStylePropertiesSchema.partial().optional(),
    }),
    children: z.array(IRNodeSchema).optional(),
  })
);

export const IRDocumentSchema = z.object({
  version: z.literal('1.0'),
  title: z.string().optional(),
  sourceUrl: z.string().optional(),
  capturedAt: z.string(),
  viewports: z.array(z.enum(['desktop', 'tablet', 'mobile'])),
  root: IRNodeSchema,
});
