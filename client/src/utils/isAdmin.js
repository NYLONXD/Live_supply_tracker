export const isAdmin = (user) => {
  const adminEmails = ["Nylonxd2005@gmail.com"]; // Add more if needed
  return user && adminEmails.includes(user.email);
};
