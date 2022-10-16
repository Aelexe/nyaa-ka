import axios from "axios";
import { parse } from "node-html-parser";

export enum SearchParams {
	query = "q",
	category = "c",
	filter = "f",
	sort = "s",
	order = "o",
	page = "[",
}

export enum Filter {
	NoFilter = "0",
	NoRemakes = "1",
	TrustedOnly = "2",
}

export enum Category {
	All = "0_0",
	Anime = "1_0",
	AnimeMusicVideo = "1_1",
	AnimeEnglish = "1_2",
	AnimeNonEnglish = "1_3",
	AnimeRaw = "1_4",
	Audio = "2_0",
	AudioLossless = "2_1",
	AudioLossy = "2_2",
	Literature = "3_0",
	LiteratureEnglish = "3_1",
	LiteratureNonEnglish = "3_2",
	LiteratureRaw = "3_3",
	LiveAction = "4_0",
	LiveActionEnglish = "4_1",
	LiveActionIdolPromotionalVideo = "4_2",
	LiveActionNonEnglish = "4_3",
	LiveActionRaw = "4_4",
	Pictures = "5_0",
	PicturesGraphics = "5_1",
	PicturesPhotoos = "5_2",
	Software = "6_0",
	SoftwareApplications = "6_1",
	SoftwareGames = "6_2",
}

export enum SortColumn {
	Comments = "comments",
	Size = "size",
	Date = "id",
	Seeders = "seeders",
	Leechers = "leechers",
	Downloads = "downloads",
}

export enum SortOrder {
	Ascending = "asc",
	Descending = "desc",
}

interface Torrent {
	category: Category;
	title: string;
	link: string;
	downloadLink: string;
	magnetLink: string;
	size: number;
	date: Date;
	seeders: number;
	leechers: number;
	totalDownloads: number;
}

interface SearchOptions {
	category?: Category;
	filter?: Filter;
	sort?: {
		column: SortColumn;
		order: SortOrder;
	};
	page?: number;
}

interface SearchResponse {
	torrents: Torrent[];
	previous?: boolean;
	next?: boolean;
}

class NyaaKa {
	private readonly NYAA_URL = "https://nyaa.si/";

	public async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
		const url = new URL(this.NYAA_URL);

		url.searchParams.set(SearchParams.query, query);
		url.searchParams.set(SearchParams.category, options?.category || Category.All);
		url.searchParams.set(SearchParams.filter, options?.filter || Filter.NoFilter);

		if (options?.sort) {
			url.searchParams.set(SearchParams.sort, options.sort.column);
			url.searchParams.set(SearchParams.order, options.sort.order);
		}

		if (options?.page) {
			url.searchParams.set(SearchParams.page, options.page.toString());
		}

		const searchResponse: SearchResponse = { torrents: [] };

		const response = await axios.get(url.href);
		const document = parse(response.data);

		const rows = document.querySelectorAll("tbody tr");

		const previous = document.querySelector(".pagination li:first-child:not(.disabled) a")?.getAttribute("href");
		const next = document.querySelector(".pagination li:last-child:not(.disabled) a")?.getAttribute("href");

		searchResponse.previous = previous !== undefined;
		searchResponse.next = next !== undefined;

		rows.forEach((row) => {
			const category = row.querySelector("td:nth-child(1) a").getAttribute("href").split("=")[1];
			const titleLink = row.querySelector("td:nth-child(2) a:not(.comments)");
			const title = titleLink.text;
			const link = titleLink.getAttribute("href");
			const downloadLink = row.querySelector("td:nth-child(3) a:nth-child(1)").getAttribute("href");
			const magnetLink = row.querySelector("td:nth-child(3) a:nth-child(2)").getAttribute("href");
			const sizeString = row.querySelector("td:nth-child(4)").text;
			const date = new Date(Number.parseInt(row.querySelector("td:nth-child(5)").getAttribute("data-timestamp")));
			const seeders = Number.parseInt(row.querySelector("td:nth-child(6)").text);
			const leechers = Number.parseInt(row.querySelector("td:nth-child(7)").text);
			const totalDownloads = Number.parseInt(row.querySelector("td:nth-child(8)").text);

			const [sizeNumber, sizeUnit] = sizeString.split(" ");

			let size = Number.parseFloat(sizeNumber);

			switch (sizeUnit) {
				case "KiB":
					size *= 1000;
					break;
				case "MiB":
					size *= 1000000;
					break;
				case "GiB":
					size *= 1000000000;
					break;
				case "TiB":
					size *= 1000000000000;
					break;
			}

			searchResponse.torrents.push({
				category: category as Category,
				title,
				link,
				downloadLink,
				magnetLink,
				size,
				date,
				seeders,
				leechers,
				totalDownloads,
			});
		});

		return searchResponse;
	}
}

export default new NyaaKa();
