'use client'
import HeroCarousel from '@/app/components/Carousel';

export default function AboutPage() {
        // Create an array that uses the photos from public that you want
        const images = [
            {src: '/AboutHeroImages/KOC_Booth.jpg' , alt: 'Bazaar', caption:'KoC 9094 Bazaar Booth'},
            {src: '/AboutHeroImages/The_Crew.jpg', alt: 'Council 9094' , caption:'Some members of council 9094'},
            {src: '/AboutHeroImages/Building_A_Ramp.jpg', alt: 'Building a Ramp', caption: 'The Laborers at Work'},
            {src: '/AboutHeroImages/Blue_Shirt.jpg', alt: 'Council Shirt', caption: ''},
        ]
        // 

    return (
        <>
        <div className='row'>
            <div className='col-12'>
                <HeroCarousel images={images} />
            </div>
        </div>
        <div className='row my-5'>
        <div className='col-12 text-center'>
            <h1 className="mb-4">About Council 9094</h1>
            <p className="lead">
            A Fraternal Catholic Service Organization
            </p>
        </div>
        <div className='col-lg-10 mx-auto'>
            <div className="p-4 bg-light rounded shadow-sm">
            <p>
                The Knights of Columbus stands as a powerful global Catholic fraternal service
                organization, established in 1882 by Father Michael J. McGivney in New Haven,
                Connecticut. Our founding purpose was clear: to provide essential financial support to
                the widows and orphans of Catholic parishioners. Over the years, we have grown into
                one of the world&#39;s largest Catholic service organizations, boasting millions of members
                across the globe.
            </p>
            <p>
                Our mission is uncompromising, emphasizing charity, unity, fraternity, and patriotism. As
                Knights, we are unwavering in our commitment to bolster the Catholic Church, enhance
                our local communities, and support one another through meaningful acts of charity,
                dedicated volunteerism, and steadfast advocacy for Catholic values.
            </p>
            <p>
                Every parish church typically houses a Knights of Columbus chapter, and we proudly
                represent Sacred Heart Church through Council 9094 in d’Iberville, Mississippi. Our
                council is strong, with over 145 active members devoted to serving our parish and
                community. In 2024 alone, Council 9094 contributed over $37,000 to significant causes,
                including assistance to families, church initiatives, community support, pro-life
                programs, and patriotic efforts. Looking ahead to 2025, our members are poised to
                volunteer for over 50,000 hours and drive various fundraising efforts—supporting food
                banks, the Global Wheelchair Program, honoring Veterans, providing disaster relief,
                promoting pro-life activities, and backing Seminarians, among others.
            </p>
            <p className="fw-bold text-center mt-4">
                You have the opportunity to make a meaningful impact in your family, your community,
                and your faith. Join us at Knights of Columbus, Council 9094 in d’Iberville, and be a part
                of something transformative.
            </p>
            </div>
        </div>
        </div>        
        </>
    );
}