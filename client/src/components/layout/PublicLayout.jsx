import Navbar from '../Navbar';

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

export default PublicLayout;