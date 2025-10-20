export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "BookingNest"); // your preset name
  formData.append("cloud_name", "dunltycks"); // your cloud name

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dunltycks/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    return data.secure_url; // This is the uploaded image URL
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};
