# Custom Category Icons Setup

## Option 1: Local Icons (Recommended)
Create a folder `public/icons/` in your project and add your custom icon files:

```
public/
  icons/
    parukari.png      # Barber icon
    salon-bukurie.png # Beauty salon icon
    doktor.png        # Doctor icon
    dentist.png       # Dentist icon
    spa.png           # Spa icon
    fitness.png       # Fitness icon
    kafshe.png        # Pet services icon
    auto.png          # Auto services icon
    shtepie.png       # Home services icon
    tjera.png         # Other services icon
```

## Option 2: External URLs
You can also use external URLs for your icons. Just update the SQL script with your preferred URLs:

```sql
UPDATE categories SET 
  icon = 'https://your-domain.com/icons/parukari.png',
  color = '#4CAF50'
WHERE name = 'Parukari';
```

## Option 3: CDN URLs
Use a CDN service like Cloudinary, AWS S3, or any other image hosting service:

```sql
UPDATE categories SET 
  icon = 'https://res.cloudinary.com/your-account/image/upload/icons/parukari.png',
  color = '#4CAF50'
WHERE name = 'Parukari';
```

## Icon Requirements
- **Format**: PNG recommended (supports transparency)
- **Size**: 32x32px or 64x64px for best results
- **Background**: Transparent or solid color
- **Style**: Simple, recognizable icons that represent each category

## Running the SQL
After setting up your icons, run the SQL script:

```bash
psql $env:DATABASE_URL -f add_category_icon_color.sql
```

## Testing
After running the SQL, refresh your application and check that all category icons are displaying correctly in the dropdown and on the map.

