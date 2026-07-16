/**
 * Utility to serialize and deserialize blocks to and from the database.
 * Storing metadata such as layout width, margin, padding, align, font (caption),
 * and image dimensions inside the standard Supabase tables without modifying the schema.
 */

export const serializeBlocks = (blocks) => {
  if (!blocks || !Array.isArray(blocks)) return [];
  
  return blocks.map((b, i) => {
    let type = b.type;
    let content = b.content || '';
    
    if (type === 'page-break') {
      type = 'text';
      content = `<!-- block-type: page-break | width: ${b.width || '1'} -->`;
    } else if (type === 'spacer') {
      type = 'text';
      content = `<!-- block-type: spacer | height: ${b.content || '50px'} | width: ${b.width || '1'} -->`;
    } else if (type === 'custom-font') {
      type = 'text';
      content = `<!-- block-type: custom-font | name: ${b.caption || ''} | url: ${b.content || ''} -->`;
    } else if (type === 'text') {
      const meta = {};
      if (b.width && b.width !== '1') meta.width = b.width;
      if (b.margin) meta.margin = b.margin;
      if (b.padding) meta.padding = b.padding;
      if (b.align && b.align !== 'justify') meta.align = b.align;
      if (b.caption) meta.font = b.caption;
      
      if (Object.keys(meta).length > 0) {
        content = `<!-- block-meta:${JSON.stringify(meta)} -->\n${b.content || ''}`;
      } else {
        content = b.content || '';
      }
    } else if (type === 'image') {
      const meta = {};
      if (b.width && b.width !== '1') meta.width = b.width;
      if (b.margin) meta.margin = b.margin;
      if (b.padding) meta.padding = b.padding;
      if (b.align && b.align !== 'center') meta.align = b.align;
      if (b.imageWidth) meta.imageWidth = b.imageWidth;
      if (b.imageHeight) meta.imageHeight = b.imageHeight;
      if (b.caption) meta.caption = b.caption;
      
      const baseUrl = b.content || '';
      // Strip any existing hash if present in baseUrl to avoid duplication
      const cleanUrl = baseUrl.split('#')[0];
      
      if (Object.keys(meta).length > 0) {
        const hashParams = Object.entries(meta)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&');
        content = `${cleanUrl}#${hashParams}`;
      } else {
        content = cleanUrl;
      }
    }
    
    return {
      type,
      content,
      sort_order: i
    };
  });
};

export const deserializeBlocks = (dbBlocks) => {
  if (!dbBlocks || !Array.isArray(dbBlocks)) return [];
  
  return dbBlocks.map((b) => {
    const id = b.id || `block-${Date.now()}-${Math.random()}`;
    let type = b.type;
    let content = b.content || '';
    
    // Default metadata values
    let width = '1';
    let margin = '';
    let padding = '';
    let align = type === 'image' ? 'center' : 'justify';
    let imageWidth = '';
    let imageHeight = '';
    let caption = '';
    
    if (type === 'text') {
      if (content.startsWith('<!-- block-type: page-break')) {
        type = 'page-break';
        const widthMatch = content.match(/width:\s*([^ ]+)/);
        width = widthMatch ? widthMatch[1].replace('-->', '').trim() : '1';
        content = '';
      } else if (content.startsWith('<!-- block-type: spacer')) {
        type = 'spacer';
        const heightMatch = content.match(/height:\s*([^ |]+)/);
        const widthMatch = content.match(/width:\s*([^ ]+)/);
        const height = heightMatch ? heightMatch[1].trim() : '50px';
        width = widthMatch ? widthMatch[1].replace('-->', '').trim() : '1';
        content = height;
      } else if (content.startsWith('<!-- block-type: custom-font')) {
        type = 'custom-font';
        const nameMatch = content.match(/name:\s*([^ |]+)/);
        const urlMatch = content.match(/url:\s*([^ ]+)/);
        caption = nameMatch ? nameMatch[1].trim() : '';
        content = urlMatch ? urlMatch[1].replace('-->', '').trim() : '';
      } else if (content.startsWith('<!-- block-meta:')) {
        const metaEndIndex = content.indexOf('-->');
        if (metaEndIndex !== -1) {
          const metaJsonStr = content.slice('<!-- block-meta:'.length, metaEndIndex).trim();
          try {
            const meta = JSON.parse(metaJsonStr);
            width = meta.width || '1';
            margin = meta.margin || '';
            padding = meta.padding || '';
            align = meta.align || 'justify';
            caption = meta.font || '';
          } catch (e) {
            console.error("Error parsing block metadata:", e);
          }
          // The actual markdown content is after the comment tag
          content = content.slice(metaEndIndex + 3);
          if (content.startsWith('\n')) {
            content = content.slice(1);
          }
        }
      }
    } else if (type === 'image') {
      const hashIndex = content.indexOf('#');
      if (hashIndex !== -1) {
        const baseUrl = content.slice(0, hashIndex);
        const hashStr = content.slice(hashIndex + 1);
        content = baseUrl;
        
        try {
          const params = new URLSearchParams(hashStr);
          width = params.get('width') || '1';
          margin = params.get('margin') || '';
          padding = params.get('padding') || '';
          align = params.get('align') || 'center';
          imageWidth = params.get('imageWidth') || '';
          imageHeight = params.get('imageHeight') || '';
          caption = params.get('caption') || '';
        } catch (e) {
          console.error("Error parsing image hash params:", e);
        }
      }
    }
    
    return {
      id,
      type,
      content,
      width,
      margin,
      padding,
      align,
      imageWidth,
      imageHeight,
      caption
    };
  });
};
