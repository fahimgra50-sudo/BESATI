import Header from "@/components/Header";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f2f0e9]">
      <Header showSearch={false} />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-display font-bold text-2xl mb-6">গোপনীয়তা নীতি (Privacy Policy)</h1>

        <div className="bg-white rounded-2xl p-6 space-y-5 text-sm leading-relaxed text-[#4B5850]">
          <p>বেসাতি ("আমরা") আমাদের কাস্টমারদের গোপনীয়তা রক্ষা করাকে গুরুত্ব দেয়। এই নীতিতে বর্ণনা করা হয়েছে আমরা কীভাবে আপনার তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষিত রাখি।</p>

          <div>
            <h2 className="font-bold text-[#1B2A22] mb-2">আমরা যে তথ্য সংগ্রহ করি</h2>
            <p>অর্ডার করার সময় আমরা আপনার নাম, মোবাইল নম্বর, ঠিকানা এবং ইমেইল (ঐচ্ছিক) সংগ্রহ করি — শুধুমাত্র আপনার অর্ডার প্রক্রিয়া করা ও ডেলিভারি দেওয়ার জন্য।</p>
          </div>

          <div>
            <h2 className="font-bold text-[#1B2A22] mb-2">তথ্যের ব্যবহার</h2>
            <p>সংগৃহীত তথ্য শুধুমাত্র অর্ডার প্রক্রিয়াকরণ, ডেলিভারি, গ্রাহক সহায়তা এবং লয়্যালটি প্রোগ্রামের জন্য ব্যবহৃত হয়। আমরা কখনো আপনার তথ্য তৃতীয় পক্ষের কাছে বিক্রি করি না।</p>
          </div>

          <div>
            <h2 className="font-bold text-[#1B2A22] mb-2">Facebook Messenger</h2>
            <p>আপনি যদি আমাদের Facebook Page-এ মেসেজ পাঠান, আপনার মেসেজ আমাদের গ্রাহক সহায়তা প্রদানের জন্য (স্বয়ংক্রিয় বা ম্যানুয়ালি) ব্যবহৃত হতে পারে। আমরা আপনার Messenger তথ্য অন্য কোনো উদ্দেশ্যে ব্যবহার বা শেয়ার করি না।</p>
          </div>

          <div>
            <h2 className="font-bold text-[#1B2A22] mb-2">তথ্য সুরক্ষা</h2>
            <p>আপনার তথ্য নিরাপদে সংরক্ষণ করা হয় এবং অননুমোদিত প্রবেশ থেকে সুরক্ষিত রাখতে যুক্তিসঙ্গত ব্যবস্থা নেওয়া হয়।</p>
          </div>

          <div>
            <h2 className="font-bold text-[#1B2A22] mb-2">যোগাযোগ</h2>
            <p>এই গোপনীয়তা নীতি সম্পর্কে কোনো প্রশ্ন থাকলে আমাদের Facebook Page-এর মাধ্যমে যোগাযোগ করুন।</p>
          </div>

          <p className="text-xs text-[#8A8A78] pt-4 border-t border-[#E7E4DA]">সর্বশেষ আপডেট: {new Date().toLocaleDateString("bn-BD")}</p>
        </div>
      </main>
    </div>
  );
    }
