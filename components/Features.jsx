import { Shield, Truck, Headphones, Cpu, Smartphone, Laptop, Star } from "lucide-react";

const features = [
  {
    id: 1,
    title: "Premium Devices",
    description: "Only genuine, high-quality phones, laptops, and accessories from top brands.",
    icon: <Star className="h-8 w-8 text-blue-500" />,
  },
  {
    id: 2,
    title: "Secure Payments",
    description: "Shop with confidence using our secure payment options and encryption.",
    icon: <Shield className="h-8 w-8 text-blue-500" />,
  },
  {
    id: 3,
    title: "Fast Delivery",
    description: "Quick shipping with reliable courier partners.",
    icon: <Truck className="h-8 w-8 text-blue-500" />,
  },
  {
    id: 4,
    title: "Tech Support",
    description: "Dedicated customer support for all your technical questions.",
    icon: <Headphones className="h-8 w-8 text-blue-500" />,
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container px-4 md:px-6">
        <h2 className="text-4xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
            Why Choose Wayakart
          </h2>
       
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Your trusted destination for premium electronics and exceptional service
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div 
              key={feature.id} 
              className="bg-white hover:bg-gray-50 transition-all duration-300 rounded-xl p-8 border border-gray-200 hover:border-blue-300 group shadow-sm hover:shadow-md"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-4 mb-4 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;