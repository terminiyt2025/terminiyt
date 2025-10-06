"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Head from "next/head";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { BookingSteps } from "@/components/booking-steps";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  Facebook,
  Star,
  Clock,
  Users,
  Building2,
  Calendar,
} from "lucide-react";
import Image from "next/image";

interface Business {
  id: number;
  name: string;
  slug: string;
  description?: string;
  category_name: string;
  owner_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  account_email: string;
  google_maps_link?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  instagram?: string;
  facebook?: string;
  logo?: string;
  business_images?: string[];
  operating_hours?: any;
  services?: any[];
  staff?: any[];
  is_verified: boolean;
  is_active: boolean;
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export default function BusinessPage() {
  const params = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingSteps, setShowBookingSteps] = useState(true);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const response = await fetch(`/api/businesses/slug/${params.slug}`);

        if (response.ok) {
          const businessData = await response.json();
          setBusiness(businessData);
        } else if (response.status === 404) {
          setError("Ky biznes nuk ekziston ose nuk është i disponueshëm për momentin.");
        } else {
          setError("Ndodhi një gabim gjatë ngarkimit të biznesit");
        }
      } catch (err) {
        console.error("Error fetching business:", err);
        setError("Ndodhi një gabim gjatë ngarkimit të biznesit");
      } finally {
        setLoading(false);
      }
    };

    if (params.slug) {
      fetchBusiness();
    }
  }, [params.slug]);

  // Update page title when business data is loaded
  useEffect(() => {
    if (business) {
      document.title = `${business.name} - ServiceConnect`;
    }
  }, [business]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 to-teal-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Po ngarkohet...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 to-teal-800">
        <Header transparent={true} />
        <div className="container mx-auto px-4 py-32">
          <div className="text-center">
            <div className="mb-8">
              <div className=" flex items-center justify-center">
                <Image 
                  src="/logo.png" 
                  alt="ServiceConnect Logo" 
                  width={120} 
                  height={70}
                  className="w-48 h-20"
                />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Na vjen keq...
              </h1>
              <p className="text-teal-100 mb-8 max-w-md mx-auto">
                {error}
              </p>
            </div>
            <div className="space-y-4">
              <Button asChild size="lg" className="w-full sm:w-auto bg-white hover:bg-white/90 focus:bg-white/90 text-black text-lg ">
                <a href="/">Kthehu në faqen kryesore</a>
              </Button>
              
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatOperatingHours = (hours: any) => {
    if (!hours) return null;

    const dayNames = {
      monday: "E Hënë",
      tuesday: "E Martë",
      wednesday: "E Mërkurë",
      thursday: "E Enjte",
      friday: "E Premte",
      saturday: "E Shtunë",
      sunday: "E Diel",
    };

    return Object.entries(dayNames)
      .map(([day, name]) => {
        const dayHours = hours[day];
        if (!dayHours) return null;

        return (
          <div key={day} className="flex justify-between">
            <span className="font-medium">{name}:</span>
            <span>
              {dayHours.closed
                ? "Mbyllur"
                : `${dayHours.open} - ${dayHours.close}`}
            </span>
          </div>
        );
      })
      .filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-teal-800">
      <Header transparent={true} />
      
     

      {/* Booking Steps */}
      {showBookingSteps && business && (
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-2 mt-8">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                Cakto Terminin
              </div>
            </div>
            <BookingSteps business={business} />
          </div>
        </div>
      )}
    </div>
  );
}
