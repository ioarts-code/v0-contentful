import ContentfulImage from "@/lib/contentful-image";

export default function Avatar({
  name,
  picture,
}: {
  name: string;
  picture: any;
}) {
  if (!picture || !picture.url) {
    return (
      <div className="flex items-center">
        <div className="mr-4 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-gray-500 text-xl font-bold">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="text-xl font-bold">{name}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <div className="mr-4 w-12 h-12">
        <ContentfulImage
          alt={name}
          className="object-cover h-full rounded-full"
          height={48}
          width={48}
          src={picture.url}
        />
      </div>
      <div className="text-xl font-bold">{name}</div>
    </div>
  );
}
