def filter_projects(page_lst, category=None):
    '''
    Gets a list of project pages (only pages that reside in
    the projects folder.)
    '''
    filtered = []

    for page in page_lst:
        if page.relative_source_path.replace('\\', '/').startswith('projects/') and \
            (category is None or page.metadata.get("category") == category):
            filtered.append(page)
    
    sorted_filtered_lst = sorted(filtered, key=lambda el: el.metadata["importance"])
    return sorted_filtered_lst 